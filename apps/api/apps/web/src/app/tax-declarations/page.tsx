'use client';

import React, { useState } from 'react';

export default function TaxDeclarationsHub() {
  const [annualGross, setAnnualGross] = useState<number>(1200000);
  const [regime, setRegime] = useState<'NEW_REGIME_115BAC' | 'OLD_REGIME'>('NEW_REGIME_115BAC');
  const [deductions80C, setDeductions80C] = useState<number>(150000);
  const [deductions80D, setDeductions80D] = useState<number>(25000);

  // Live calculation logic
  const isNew = regime === 'NEW_REGIME_115BAC';
  const standardDeduction = isNew ? 75000 : 50000;
  const chapterVIA = isNew ? 0 : Math.min(deductions80C, 150000) + Math.min(deductions80D, 50000);
  const taxableIncome = Math.max(0, annualGross - standardDeduction - chapterVIA);

  let taxBeforeRebate = 0;
  if (isNew) {
    if (taxableIncome > 2400000) taxBeforeRebate += (taxableIncome - 2400000) * 0.30 + 260000;
    else if (taxableIncome > 2000000) taxBeforeRebate += (taxableIncome - 2000000) * 0.25 + 160000;
    else if (taxableIncome > 1600000) taxBeforeRebate += (taxableIncome - 1600000) * 0.20 + 80000;
    else if (taxableIncome > 1200000) taxBeforeRebate += (taxableIncome - 1200000) * 0.15 + 20000;
    else if (taxableIncome > 800000) taxBeforeRebate += (taxableIncome - 800000) * 0.10;
    else if (taxableIncome > 400000) taxBeforeRebate += (taxableIncome - 400000) * 0.05;
  } else {
    if (taxableIncome > 1000000) taxBeforeRebate += (taxableIncome - 1000000) * 0.30 + 112500;
    else if (taxableIncome > 500000) taxBeforeRebate += (taxableIncome - 500000) * 0.20 + 12500;
    else if (taxableIncome > 250000) taxBeforeRebate += (taxableIncome - 250000) * 0.05;
  }

  // 87A Rebate & Marginal Relief
  let rebate = 0;
  let marginalRelief = 0;
  if (isNew) {
    if (taxableIncome <= 1200000) rebate = taxBeforeRebate;
    else if (taxBeforeRebate > taxableIncome - 1200000) marginalRelief = taxBeforeRebate - (taxableIncome - 1200000);
  } else {
    if (taxableIncome <= 500000) rebate = Math.min(taxBeforeRebate, 12500);
  }

  const netTax = Math.max(0, taxBeforeRebate - rebate - marginalRelief);
  const cess = Math.round(netTax * 0.04);
  const totalAnnualTax = netTax + cess;
  const monthlyTds = Math.round(totalAnnualTax / 12);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Income Tax & TDS Portal (FY 2026-27)</h1>
          <p className="text-sm text-slate-500 mt-1">Dual-Regime Tax Projections, Standard Deduction & Section 87A Marginal Relief</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          AY 2027-28 Tax Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Taxable Income</span>
          <div className="text-2xl font-bold text-slate-900">₹{taxableIncome.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500">Gross ₹{annualGross.toLocaleString('en-IN')} - Std Ded ₹{standardDeduction.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Section 87A Relief</span>
          <div className="text-2xl font-bold text-emerald-600">₹{(rebate + marginalRelief).toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500">{rebate > 0 ? 'Full 87A Tax Rebate' : marginalRelief > 0 ? '87A Marginal Relief Applied' : 'No Rebate'}</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Monthly TDS Withholding</span>
          <div className="text-2xl font-bold text-indigo-600">₹{monthlyTds.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500">Annual Tax Liability: ₹{totalAnnualTax.toLocaleString('en-IN')} (incl. 4% Cess)</p>
        </div>
      </div>

      {/* Interactive Tax Simulator */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-6">
        <h3 className="text-base font-semibold text-slate-900">Interactive Tax Projection Simulator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Projected Annual Gross (₹)</label>
            <input
              type="number"
              value={annualGross}
              onChange={(e) => setAnnualGross(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Regime Selection</label>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
            >
              <option value="NEW_REGIME_115BAC">New Tax Regime (Section 115BAC)</option>
              <option value="OLD_REGIME">Old Tax Regime (With Chapter VI-A)</option>
            </select>
          </div>
        </div>

        {!isNew && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section 80C Deductions (Max ₹1.5L)</label>
              <input
                type="number"
                value={deductions80C}
                onChange={(e) => setDeductions80C(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section 80D Health Insurance (Max ₹50k)</label>
              <input
                type="number"
                value={deductions80D}
                onChange={(e) => setDeductions80D(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}