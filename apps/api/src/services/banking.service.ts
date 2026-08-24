import { PrismaClient, BatchStatus, InstructionStatus } from '@prisma/client';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class BankingService {
  public static maskAccountNumber(accountNumber: string | null | undefined): string {
    if (!accountNumber) return 'XXXXXXXX0000';
    const trimmed = accountNumber.trim();
    if (trimmed.length <= 4) return 'XXXXXXXX' + trimmed;
    return 'XXXXXXXX' + trimmed.substring(trimmed.length - 4);
  }

  public static async createBatch(params: {
    companyId: string;
    payrollCycleId: string;
    paymentDate: Date;
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: params.payrollCycleId, companyId: params.companyId },
      include: { records: { include: { employee: true } } },
    });

    if (!cycle) throw new Error('Payroll cycle not found');
    if (!['APPROVED', 'LOCKED'].includes(cycle.status)) {
      throw new Error(`Payroll cycle must be APPROVED or LOCKED to generate payment batch. Current status: ${cycle.status}`);
    }

    const existingBatch = await prisma.disbursementBatch.findFirst({
      where: { payrollCycleId: cycle.id },
    });
    if (existingBatch) {
      throw new Error('A payment batch already exists for this payroll cycle');
    }

    const batchReference = `BATCH-${cycle.year}-${cycle.month}-${Math.floor(Math.random() * 10000)}`;

    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalRecords = 0;

      const batch = await tx.disbursementBatch.create({
        data: {
          companyId: params.companyId,
          payrollCycleId: cycle.id,
          batchReference,
          financialYear: `${cycle.year}-${cycle.year + 1}`,
          paymentDate: params.paymentDate,
          status: BatchStatus.PENDING,
          createdById: params.actorUserId,
        },
      });

      for (const rec of cycle.records) {
        const masked = this.maskAccountNumber(rec.employee.bankAccount);
        const ifsc = rec.employee.ifsc || 'HDFC0001234';

        await tx.paymentInstruction.create({
          data: {
            batchId: batch.id,
            employeeId: rec.employeeId,
            payrollRecordId: rec.id,
            beneficiaryName: rec.employee.name,
            bankName: rec.employee.bankName || 'Corporate Bank',
            maskedAccount: masked,
            ifscCode: ifsc,
            netPayable: rec.netSalary,
            status: InstructionStatus.PENDING,
          },
        });

        totalAmount += rec.netSalary;
        totalRecords += 1;
      }

      const updatedBatch = await tx.disbursementBatch.update({
        where: { id: batch.id },
        data: { totalAmount, totalRecords, status: BatchStatus.VALIDATED },
        include: { instructions: true },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'DISBURSEMENT_BATCH_CREATED',
        entity: 'DisbursementBatch',
        entityId: batch.id,
        afterState: { batchReference, totalRecords, totalAmount },
      });

      return updatedBatch;
    });
  }

  public static async approveBatch(params: {
    companyId: string;
    batchId: string;
    approverUserId: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const batch = await prisma.disbursementBatch.findFirst({
      where: { id: params.batchId, companyId: params.companyId },
    });

    if (!batch) throw new Error('Disbursement batch not found');
    if (batch.createdById === params.approverUserId) {
      throw new Error('Maker-Checker Violation: Approver cannot be the same user who prepared the disbursement batch');
    }

    return prisma.$transaction(async (tx) => {
      const approved = await tx.disbursementBatch.update({
        where: { id: batch.id },
        data: {
          status: BatchStatus.APPROVED,
          approvedById: params.approverUserId,
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
        include: { instructions: true },
      });

      await tx.paymentInstruction.updateMany({
        where: { batchId: batch.id },
        data: { status: InstructionStatus.APPROVED },
      });

      await AuditService.log({
        companyId: params.companyId,
        userId: params.approverUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: 'DISBURSEMENT_BATCH_APPROVED',
        entity: 'DisbursementBatch',
        entityId: batch.id,
        afterState: { status: 'APPROVED', totalAmount: batch.totalAmount },
      });

      return approved;
    });
  }

  public static async exportNeftCsv(params: { companyId: string; batchId: string }) {
    const batch = await prisma.disbursementBatch.findFirst({
      where: { id: params.batchId, companyId: params.companyId },
      include: { instructions: { include: { employee: true } } },
    });

    if (!batch) throw new Error('Batch not found');

    let csv = 'Beneficiary Name,Masked Account,IFSC Code,Net Payable,Batch Reference\n';
    for (const ins of batch.instructions) {
      csv += `"${ins.beneficiaryName}","${ins.maskedAccount}","${ins.ifscCode}",${ins.netPayable},"${batch.batchReference}"\n`;
    }
    return csv;
  }

  public static async retryPayment(params: {
    companyId: string;
    instructionId: string;
    actorUserId?: string;
    actorEmail: string;
    actorRole: string;
  }) {
    const ins = await prisma.paymentInstruction.findFirst({
      where: { id: params.instructionId, batch: { companyId: params.companyId } },
    });

    if (!ins) throw new Error('Payment instruction not found');
    if (ins.status !== InstructionStatus.FAILED && ins.status !== InstructionStatus.REJECTED) {
      throw new Error('Only FAILED or REJECTED payment instructions can be retried');
    }

    const updated = await prisma.paymentInstruction.update({
      where: { id: ins.id },
      data: {
        status: InstructionStatus.APPROVED,
        retryCount: { increment: 1 },
        failureReason: null,
      },
    });

    await AuditService.log({
      companyId: params.companyId,
      userId: params.actorUserId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'PAYMENT_INSTRUCTION_RETRIED',
      entity: 'PaymentInstruction',
      entityId: ins.id,
      afterState: { retryCount: updated.retryCount, status: 'APPROVED' },
    });

    return updated;
  }

  public static async getReconciliation(params: { companyId: string; batchId: string }) {
    const batch = await prisma.disbursementBatch.findFirst({
      where: { id: params.batchId, companyId: params.companyId },
      include: { payrollCycle: { include: { records: true } }, instructions: true },
    });

    if (!batch) throw new Error('Batch not found');

    const totalNetPayableRecords = batch.payrollCycle.records.reduce((sum, r) => sum + r.netSalary, 0);
    const totalInstructionsAmount = batch.instructions.reduce((sum, i) => sum + i.netPayable, 0);
    const variance = Number((totalNetPayableRecords - totalInstructionsAmount).toFixed(2));

    return {
      batchReference: batch.batchReference,
      totalNetPayableRecords,
      totalInstructionsAmount,
      variance,
      status: variance === 0 ? 'MATCHED' : 'MISMATCH',
    };
  }
}