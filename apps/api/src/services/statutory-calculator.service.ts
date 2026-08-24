import { StatutoryConfigType, StatutoryConfigStatus } from '@prisma/client';
import { StatutoryConfigService } from './statutory-config.service';

export interface EpfCalculationResult {
  isApplicable: boolean;
  configId?: string;
  configVersion?: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  employeeContribution: number;
  employerContribution: number;
  epsContribution: number;
  edliContribution: number;
  adminCharges: number;
  excessWage: number;
}

export interface EsicCalculationResult {
  isApplicable: boolean;
  isEligible: boolean;
  configId?: string;
  configVersion?: number;
  grossWages: number;
  employeeContribution: number;
  employerContribution: number;
}

export interface PtCalculationResult {
  isApplicable: boolean;
  configId?: string;
  configVersion?: number;
  stateCode: string;
  grossWages: number;
  monthlyDeduction: number;
  slabDescription?: string;
}

export interface StatutoryCalculationSnapshot {
  calculatedAt: string;
  epf: EpfCalculationResult;
  esic: EsicCalculationResult;
  pt: PtCalculationResult;
}

export class StatutoryCalculatorService {
  /**
   * Deterministic round half up to nearest integer paise/rupee
   */
  public static roundRupee(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  public static roundToNearestInteger(amount: number): number {
    return Math.round(amount);
  }

  public static ceilToInteger(amount: number): number {
    return Math.ceil(amount);
  }

  /**
   * EPF Calculation
   * Default statutory parameters: 12% EE, 3.67% ER EPF, 8.33% EPS, Wage Ceiling: ₹15,000
   */
  public static async calculateEpf(params: {
    companyId: string;
    targetDate: Date;
    isEpfApplicable: boolean;
    basicSalary: number;
    earnedBasicSalary: number;
  }): Promise<EpfCalculationResult> {
    if (!params.isEpfApplicable || params.earnedBasicSalary <= 0) {
      return {
        isApplicable: false,
        epfWages: 0,
        epsWages: 0,
        edliWages: 0,
        employeeContribution: 0,
        employerContribution: 0,
        epsContribution: 0,
        edliContribution: 0,
        adminCharges: 0,
        excessWage: 0,
      };
    }

    const config = await StatutoryConfigService.resolveActiveConfig({
      companyId: params.companyId,
      configType: StatutoryConfigType.EPF,
      targetDate: params.targetDate,
    });

    const rules = (config?.rulesJson as any) || {};
    const wageCeiling = typeof rules.wageCeiling === 'number' ? rules.wageCeiling : 15000;
    const employeeRate = typeof rules.employeeRate === 'number' ? rules.employeeRate : 0.12;
    const employerEpfRate = typeof rules.employerEpfRate === 'number' ? rules.employerEpfRate : 0.0367;
    const epsRate = typeof rules.epsRate === 'number' ? rules.epsRate : 0.0833;
    const edliRate = typeof rules.edliRate === 'number' ? rules.edliRate : 0.005;
    const adminRate = typeof rules.adminRate === 'number' ? rules.adminRate : 0.005;
    const ignoreCeiling = rules.ignoreCeiling === true;

    const epfWages = ignoreCeiling ? params.earnedBasicSalary : Math.min(params.earnedBasicSalary, wageCeiling);
    const epsWages = Math.min(params.earnedBasicSalary, wageCeiling);
    const edliWages = epsWages;
    const excessWage = Math.max(0, params.earnedBasicSalary - epfWages);

    const employeeContribution = this.roundToNearestInteger(epfWages * employeeRate);
    const epsContribution = this.roundToNearestInteger(epsWages * epsRate);
    const employerEpfContribution = this.roundToNearestInteger(epfWages * employerEpfRate);
    const edliContribution = this.roundToNearestInteger(edliWages * edliRate);
    const adminCharges = this.roundToNearestInteger(epfWages * adminRate);
    const totalEmployerContribution = employerEpfContribution + epsContribution;

    return {
      isApplicable: true,
      configId: config?.id,
      configVersion: config?.version || 1,
      epfWages: this.roundRupee(epfWages),
      epsWages: this.roundRupee(epsWages),
      edliWages: this.roundRupee(edliWages),
      employeeContribution,
      employerContribution: totalEmployerContribution,
      epsContribution,
      edliContribution,
      adminCharges,
      excessWage: this.roundRupee(excessWage),
    };
  }

  /**
   * ESIC Calculation
   * Default statutory parameters: Gross Wage Threshold: ₹21,000, 0.75% EE, 3.25% ER
   */
  public static async calculateEsic(params: {
    companyId: string;
    targetDate: Date;
    isEsicApplicable: boolean;
    monthlyGross: number;
    earnedGross: number;
  }): Promise<EsicCalculationResult> {
    if (!params.isEsicApplicable || params.earnedGross <= 0) {
      return {
        isApplicable: false,
        isEligible: false,
        grossWages: 0,
        employeeContribution: 0,
        employerContribution: 0,
      };
    }

    const config = await StatutoryConfigService.resolveActiveConfig({
      companyId: params.companyId,
      configType: StatutoryConfigType.ESIC,
      targetDate: params.targetDate,
    });

    const rules = (config?.rulesJson as any) || {};
    const wageThreshold = typeof rules.wageThreshold === 'number' ? rules.wageThreshold : 21000;
    const employeeRate = typeof rules.employeeRate === 'number' ? rules.employeeRate : 0.0075;
    const employerRate = typeof rules.employerRate === 'number' ? rules.employerRate : 0.0325;

    // Eligibility evaluated against unprorated monthly gross structure
    const isEligible = params.monthlyGross <= wageThreshold;
    if (!isEligible) {
      return {
        isApplicable: true,
        isEligible: false,
        configId: config?.id,
        configVersion: config?.version || 1,
        grossWages: params.earnedGross,
        employeeContribution: 0,
        employerContribution: 0,
      };
    }

    // Deduction calculated on earned gross with statutory ceil rounding
    const employeeContribution = this.ceilToInteger(params.earnedGross * employeeRate);
    const employerContribution = this.ceilToInteger(params.earnedGross * employerRate);

    return {
      isApplicable: true,
      isEligible: true,
      configId: config?.id,
      configVersion: config?.version || 1,
      grossWages: this.roundRupee(params.earnedGross),
      employeeContribution,
      employerContribution,
    };
  }

  /**
   * Professional Tax (State-wise Slabs)
   * Evaluates active state slab rules. Standard defaults for KA, MH, TN, WB, TS, GJ.
   */
  public static async calculateProfessionalTax(params: {
    companyId: string;
    targetDate: Date;
    stateCode?: string | null;
    earnedGross: number;
    monthIndex?: number; // 1-12, where 2 is February (special slab in MH)
  }): Promise<PtCalculationResult> {
    const state = (params.stateCode || 'KA').toUpperCase();

    const config = await StatutoryConfigService.resolveActiveConfig({
      companyId: params.companyId,
      configType: StatutoryConfigType.PROFESSIONAL_TAX,
      jurisdictionState: state,
      targetDate: params.targetDate,
    });

    const month = params.monthIndex || params.targetDate.getMonth() + 1;
    let monthlyDeduction = 0;
    let slabDescription = 'Default state bracket';

    if (config && (config.rulesJson as any).slabs) {
      const slabs = (config.rulesJson as any).slabs as Array<{ min: number; max: number | null; amount: number; febAmount?: number }>;
      for (const slab of slabs) {
        if (params.earnedGross >= slab.min && (slab.max === null || params.earnedGross <= slab.max)) {
          monthlyDeduction = (month === 2 && typeof slab.febAmount === 'number') ? slab.febAmount : slab.amount;
          slabDescription = `Gross ₹${slab.min} to ${slab.max ? '₹' + slab.max : 'Above'}`;
          break;
        }
      }
    } else {
      // Deterministic fallback slabs for prominent Indian states
      switch (state) {
        case 'KA': // Karnataka: > ₹15,000 => ₹200
          if (params.earnedGross > 15000) monthlyDeduction = 200;
          break;
        case 'MH': // Maharashtra: 7.5k-10k => 175, >10k => 200 (Feb => 300)
          if (params.earnedGross > 10000) {
            monthlyDeduction = month === 2 ? 300 : 200;
          } else if (params.earnedGross > 7500) {
            monthlyDeduction = 175;
          }
          break;
        case 'TN': // Tamil Nadu: Half-yearly slab mapped to monthly average
          if (params.earnedGross > 75000) monthlyDeduction = 208;
          else if (params.earnedGross > 60000) monthlyDeduction = 171;
          else if (params.earnedGross > 45000) monthlyDeduction = 129;
          else if (params.earnedGross > 30000) monthlyDeduction = 85;
          else if (params.earnedGross > 21000) monthlyDeduction = 39;
          break;
        case 'WB': // West Bengal: >10k-15k: 110, >15k-25k: 130, >25k-40k: 150, >40k: 200
          if (params.earnedGross > 40000) monthlyDeduction = 200;
          else if (params.earnedGross > 25000) monthlyDeduction = 150;
          else if (params.earnedGross > 15000) monthlyDeduction = 130;
          else if (params.earnedGross > 10000) monthlyDeduction = 110;
          break;
        case 'TS': // Telangana: >15k-20k: 150, >20k: 200
        case 'AP': // Andhra Pradesh
          if (params.earnedGross > 20000) monthlyDeduction = 200;
          else if (params.earnedGross > 15000) monthlyDeduction = 150;
          break;
        case 'GJ': // Gujarat: >12k: 200
          if (params.earnedGross > 12000) monthlyDeduction = 200;
          break;
        default:
          monthlyDeduction = params.earnedGross > 15000 ? 200 : 0;
          break;
      }
    }

    return {
      isApplicable: true,
      configId: config?.id,
      configVersion: config?.version || 1,
      stateCode: state,
      grossWages: this.roundRupee(params.earnedGross),
      monthlyDeduction,
      slabDescription,
    };
  }
}