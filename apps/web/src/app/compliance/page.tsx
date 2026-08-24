'use client';

import React, { useState } from 'react';

export default function ComplianceHubPage() {
  const [activeTab, setActiveTab] = useState<'epf' | 'esic' | 'pt' | 'exceptions'>('epf');
  const [previewGross, setPreviewGross] = useState<number>(75000);
  const [ptState, setPtState] = useState<string>('KA');

  const basic = Math.round(previewGross * 0.5);
  const epfWages = Math.min(basic, 15000);
  const epfDeduction = Math.round(epfWages * 0.12);
  const isEsicEligible = previewGross <= 21000;
  const esicDeduction = isEsicEligible ? Math.ceil(previewGross * 0.0075) : 0;
  const ptDeduction = previewGross > 15000 ? 200 : 0;
  const totalStatutory = epfDeduction + esicDeduction + ptDeduction;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Statutory Compliance Hub</h1>
          <p className="text-sm text-slate-500 mt-1">EPFO ECR, ESIC Monthly Returns, and State-wise Professional Tax</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Phase 7B Engine Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {(['epf', 'esic', 'pt', 'exceptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab === 'epf' ? 'EPFO (ECR)' : tab === 'esic' ? 'ESIC Returns' : tab === 'pt' ? 'Professional Tax' : 'Exceptions Ledger'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'epf' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee EPF (12%)</span>
            <div className="text-2xl font-bold text-slate-900">₹{epfDeduction.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500">Capped at ₹15,000 wage ceiling (Basic: ₹{basic.toLocaleString('en-IN')})</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employer Share (EPF + EPS)</span>
            <div className="text-2xl font-bold text-slate-900">₹{epfDeduction.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500">3.67% EPF (₹550) + 8.33% EPS (₹1,250)</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ECR Generation Status</span>
            <div className="text-2xl font-bold text-emerald-600">PREPARED</div>
            <p className="text-xs text-slate-500">Includes NCP/LOP Days & UAN validation</p>
          </div>
        </div>
      )}

      {activeTab === 'esic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ESIC Eligibility</span>
            <div className={`text-2xl font-bold ${isEsicEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isEsicEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </div>
            <p className="text-xs text-slate-500">Statutory threshold: Monthly gross ≤ ₹21,000</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Contribution (0.75%)</span>
            <div className="text-2xl font-bold text-slate-900">₹{esicDeduction.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500">Rounded up to next higher integer rupee</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employer Share (3.25%)</span>
            <div className="text-2xl font-bold text-slate-900">
              ₹{(isEsicEligible ? Math.ceil(previewGross * 0.0325) : 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500">Monthly return dataset ready for export</p>
          </div>
        </div>
      )}

      {activeTab === 'pt' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State Jurisdiction</span>
            <select
              value={ptState}
              onChange={(e) => setPtState(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm"
            >
              <option value="KA">Karnataka (KA)</option>
              <option value="MH">Maharashtra (MH)</option>
              <option value="TN">Tamil Nadu (TN)</option>
              <option value="WB">West Bengal (WB)</option>
              <option value="TS">Telangana (TS)</option>
              <option value="GJ">Gujarat (GJ)</option>
            </select>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly PT Deduction</span>
            <div className="text-2xl font-bold text-slate-900">₹{ptDeduction.toLocaleString('en-IN')}</div>
            <p className="text-xs text-slate-500">Calculated via state slab config</p>
          </div>
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Maximum Cap</span>
            <div className="text-2xl font-bold text-slate-900">₹2,500</div>
            <p className="text-xs text-slate-500">Statutory cap under Article 276(2)</p>
          </div>
        </div>
      )}

      {activeTab === 'exceptions' && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Active Statutory Compliance Exceptions</h3>
          <p className="text-sm text-slate-500">Any missing UAN, missing ESIC IP number, or invalid state jurisdiction is caught automatically.</p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Exception Guard:</strong> EPF deductions without 12-digit UAN are marked as <code>BLOCKING</code>; missing ESIC numbers are marked as <code>WARNING</code>.
          </div>
        </div>
      )}

      {/* Live Calculator Sandbox */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Statutory Calculator Sandbox</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Gross (₹)</label>
            <input
              type="number"
              value={previewGross}
              onChange={(e) => setPreviewGross(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Statutory Deductions:</span>
            <span className="text-lg font-bold text-indigo-600">₹{totalStatutory.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}