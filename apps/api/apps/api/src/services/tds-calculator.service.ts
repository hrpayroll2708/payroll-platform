import { TaxRegime } from '@prisma/client';

export interface TaxSlabBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxCalculationBreakdown {
  financialYear: string;
  taxRegime: TaxRegime;
  projectedAnnualGross: number;
  exemptionsClaimed: number;
  standardDeduction: number;
  chapterVIAClaims: number;
  netTaxableIncome: number;
  grossTaxLiability: number;
  rebate87A: number;
  marginalRelief87A: number;
  netTaxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalAnnualTaxLiability: number;
  ytdTdsPaid: number;
  previousEmployerTds: number;
  remainingTaxLiability: number;
  remainingPayrollPeriods: number;
  monthlyTdsDeduction: number;
  isPanMissing: boolean;
  slabBreakdown: Array<{ bracket: string; taxableAmount: number; rate: number; taxAmount: number }>;
}

export class TdsCalculatorService {
  /**
   * Deterministic round to exact nearest integer rupee
   */
  public static round(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  public static roundInteger(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Authoritative FY 2026-27 Slabs (Budget 115BAC New Regime)
   * Standard Deduction: ₹75,000
   * 0 - 4L: 0%
   * 4L - 8L: 5%
   * 8L - 12L: 10%
   * 12L - 16L: 15%
   * 16L - 20L: 20%
   * 20L - 24L: 25%
   * Above 24L: 30%
   */
  public static readonly NEW_REGIME_SLABS_2026: TaxSlabBracket[] = [
    { min: 0, max: 400000, rate: 0.0 },
    { min: 400000, max: 800000, rate: 0.05 },
    { min: 800000, max: 1200000, rate: 0.10 },
    { min: 1200000, max: 1600000, rate: 0.15 },
    { min: 1600000, max: 2000000, rate: 0.20 },
    { min: 2000000, max: 2400000, rate: 0.25 },
    { min: 2400000, max: null, rate: 0.30 },
  ];

  /**
   * Old Regime Slabs (Standard Deduction ₹50,000)
   * 0 - 2.5L: 0%
   * 2.5L - 5L: 5%
   * 5L - 10L: 20%
   * Above 10L: 30%
   */
  public static readonly OLD_REGIME_SLABS: TaxSlabBracket[] = [
    { min: 0, max: 250000, rate: 0.0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.20 },
    { min: 1000000, max: null, rate: 0.30 },
  ];

  /**
   * Main Tax Projection Engine
   */
  public static calculateTaxProjection(params: {
    financialYear: string;
    taxRegime: TaxRegime;
    projectedAnnualGross: number;
    exemptionsClaimed?: number;
    approvedChapterVIADeductions?: number;
    ytdTdsPaid?: number;
    previousEmployerTds?: number;
    previousEmployerIncome?: number;
    remainingPayrollPeriods?: number;
    pan?: string | null;
  }): TaxCalculationBreakdown {
    const isPanValid = Boolean(params.pan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(params.pan.trim().toUpperCase()));
    const isPanMissing = !isPanValid;

    const regime = params.taxRegime || TaxRegime.NEW_REGIME_115BAC;
    const isNewRegime = regime === TaxRegime.NEW_REGIME_115BAC;

    // 1. Total projected annual gross including previous employer income
    const totalGross = params.projectedAnnualGross + (params.previousEmployerIncome || 0);

    // 2. Standard Deduction
    const standardDeduction = isNewRegime ? 75000 : 50000;

    // 3. Exemptions & Deductions
    const exemptionsClaimed = isNewRegime ? 0 : Math.max(0, params.exemptionsClaimed || 0);
    const chapterVIAClaims = isNewRegime ? 0 : Math.max(0, params.approvedChapterVIADeductions || 0);

    // 4. Net Taxable Income
    const netTaxableIncome = Math.max(0, totalGross - standardDeduction - exemptionsClaimed - chapterVIAClaims);

    // 5. Slab Calculation
    const slabs = isNewRegime ? this.NEW_REGIME_SLABS_2026 : this.OLD_REGIME_SLABS;
    let grossTaxLiability = 0;
    const slabBreakdown: Array<{ bracket: string; taxableAmount: number; rate: number; taxAmount: number }> = [];

    for (const slab of slabs) {
      if (netTaxableIncome > slab.min) {
        const upper = slab.max !== null ? Math.min(netTaxableIncome, slab.max) : netTaxableIncome;
        const taxableInSlab = Math.max(0, upper - slab.min);
        const taxInSlab = taxableInSlab * slab.rate;
        grossTaxLiability += taxInSlab;
        slabBreakdown.push({
          bracket: `₹${slab.min.toLocaleString('en-IN')} - ${slab.max ? '₹' + slab.max.toLocaleString('en-IN') : 'Above'}`,
          taxableAmount: taxableInSlab,
          rate: slab.rate,
          taxAmount: taxInSlab,
        });
      }
    }

    // 6. Section 87A Rebate & Marginal Relief
    let rebate87A = 0;
    let marginalRelief87A = 0;

    if (isNewRegime) {
      // Slabs: 0-4L (0), 4-8L (20k), 8-12L (40k) => Total tax at ₹12L = ₹60,000
      if (netTaxableIncome <= 1200000) {
        rebate87A = grossTaxLiability; // 100% tax rebate up to ₹12L taxable income
      } else {
        // Section 87A Marginal Relief: If taxable income > ₹12L, tax cannot exceed (Taxable Income - ₹12,00,000)
        const excessIncome = netTaxableIncome - 1200000;
        if (grossTaxLiability > excessIncome) {
          marginalRelief87A = grossTaxLiability - excessIncome;
        }
      }
    } else {
      // Old Regime 87A Rebate: Up to ₹5,00,000 taxable income, max rebate ₹12,500
      if (netTaxableIncome <= 500000) {
        rebate87A = Math.min(grossTaxLiability, 12500);
      }
    }

    const netTaxAfterRebate = Math.max(0, grossTaxLiability - rebate87A - marginalRelief87A);

    // 7. Surcharge (if taxable income > ₹50L)
    let surcharge = 0;
    if (netTaxableIncome > 20000000) {
      surcharge = netTaxAfterRebate * 0.25;
    } else if (netTaxableIncome > 10000000) {
      surcharge = netTaxAfterRebate * 0.15;
    } else if (netTaxableIncome > 5000000) {
      surcharge = netTaxAfterRebate * 0.10;
    }

    // 8. Health and Education Cess: 4%
    const cess = this.round((netTaxAfterRebate + surcharge) * 0.04);
    let totalAnnualTaxLiability = this.roundInteger(netTaxAfterRebate + surcharge + cess);

    // Section 206AA Penalty: If PAN missing or invalid, flat 20% on total gross
    if (isPanMissing) {
      const section206AaTax = this.roundInteger(totalGross * 0.20);
      totalAnnualTaxLiability = Math.max(totalAnnualTaxLiability, section206AaTax);
    }

    // 9. YTD Spreading
    const ytdTdsPaid = params.ytdTdsPaid || 0;
    const previousEmployerTds = params.previousEmployerTds || 0;
    const remainingTaxLiability = Math.max(0, totalAnnualTaxLiability - ytdTdsPaid - previousEmployerTds);
    const remainingPeriods = Math.max(1, params.remainingPayrollPeriods || 1);
    const monthlyTdsDeduction = this.roundInteger(remainingTaxLiability / remainingPeriods);

    return {
      financialYear: params.financialYear,
      taxRegime: regime,
      projectedAnnualGross: totalGross,
      exemptionsClaimed,
      standardDeduction,
      chapterVIAClaims,
      netTaxableIncome,
      grossTaxLiability: this.round(grossTaxLiability),
      rebate87A: this.round(rebate87A),
      marginalRelief87A: this.round(marginalRelief87A),
      netTaxAfterRebate: this.round(netTaxAfterRebate),
      surcharge: this.round(surcharge),
      cess,
      totalAnnualTaxLiability,
      ytdTdsPaid,
      previousEmployerTds,
      remainingTaxLiability,
      remainingPayrollPeriods: remainingPeriods,
      monthlyTdsDeduction,
      isPanMissing,
      slabBreakdown,
    };
  }
}