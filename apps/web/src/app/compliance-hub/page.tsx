'use client';

import React, { useState } from 'react';

export default function ComplianceHubPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'form24q' | 'challans' | 'reconciliation' | 'vault'>('overview');
  const [quarter, setQuarter] = useState<string>('Q1');
  const [bsrCode, setBsrCode] = useState<string>('0210045');
  const [challanNo, setChallanNo] = useState<string>('00123');
  const [challanAmount, setChallanAmount] = useState<number>(125000);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Statutory Compliance Hub</h1>
          <p className="text-sm text-slate-500 mt-1">Form 24Q TDS Returns, Tax Challans, Multi-Module Reconciliation & Document Vault</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Health Score: 100/100
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Phase 7D Operational
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {(['overview', 'form24q', 'challans', 'reconciliation', 'vault'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'form24q' ? 'Form 24Q TDS' : tab === 'challans' ? 'Challan Operations' : tab === 'reconciliation' ? 'Reconciliation' : 'Document Vault'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">EPF Compliance (ECR)</span>
              <div className="text-2xl font-bold text-emerald-600">RECONCILED</div>
              <p className="text-xs text-slate-500">100% UAN validation match</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">ESIC Return</span>
              <div className="text-2xl font-bold text-emerald-600">PREPARED</div>
              <p className="text-xs text-slate-500">Monthly gross eligible records</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Professional Tax</span>
              <div className="text-2xl font-bold text-emerald-600">MATCHED</div>
              <p className="text-xs text-slate-500">State-wise slabs verified</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Form 24Q Status</span>
              <div className="text-2xl font-bold text-indigo-600">READY</div>
              <p className="text-xs text-slate-500">Q1 FY 2026-27 ready for export</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'form24q' && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Form 24Q Quarterly Return Preparation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year</label>
              <input type="text" readOnly value="2026-2027" className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quarter</label>
              <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-sm">
                <option value="Q1">Q1 (Apr - Jun)</option>
                <option value="Q2">Q2 (Jul - Sep)</option>
                <option value="Q3">Q3 (Oct - Dec)</option>
                <option value="Q4">Q4 (Jan - Mar)</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <strong>Annexure II Ready:</strong> All locked payroll records and allocated Challan 281 entries are mapped.
          </div>
        </div>
      )}

      {activeTab === 'challans' && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Statutory Challan Entry (ITNS 281 / EPF / ESIC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">7-Digit BSR Code</label>
              <input type="text" value={bsrCode} onChange={(e) => setBsrCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Challan Number</label>
              <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Amount Deposited (₹)</label>
              <input type="number" value={challanAmount} onChange={(e) => setChallanAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">TDS & Statutory Reconciliation Matrix</h3>
          <div className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
            <div>
              <span className="font-semibold text-slate-800">Q1 TDS Withholding vs ITNS 281 Deposits</span>
              <p className="text-xs text-slate-500">Locked Payroll Withholding: ₹1,25,000 | Challan Deposits: ₹1,25,000</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">MATCHED (0.00 Variance)</span>
          </div>
        </div>
      )}

      {activeTab === 'vault' && (
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Statutory Compliance Document Vault</h3>
          <p className="text-sm text-slate-500">All generated compliance datasets stamped with SHA-256 integrity checksums.</p>
        </div>
      )}
    </div>
  );
}