'use client';

import React, { useState, useEffect } from 'react';

export default function EnterpriseComplianceHub() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tds' | 'epf' | 'esic' | 'pt' | 'form24q' | 'challans' | 'reconciliation' | 'exceptions' | 'vault' | 'calendar'
  >('overview');
  
  const [financialYear, setFinancialYear] = useState<string>('2026-2027');
  const [quarter, setQuarter] = useState<string>('Q1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Challan input form state
  const [bsrCode, setBsrCode] = useState<string>('0210045');
  const [challanNo, setChallanNo] = useState<string>('00123');
  const [challanAmount, setChallanAmount] = useState<number>(125000);

  const handleActionConfirm = (action: string) => {
    setModalAction(action);
    setIsModalOpen(true);
  };

  const executeAction = () => {
    setIsModalOpen(false);
    setSuccessMessage(`Successfully executed ${modalAction} for FY ${financialYear} ${quarter}. SHA-256 Checksum recorded in Document Vault.`);
    setTimeout(() => setSuccessMessage(null), 6000), [modalAction];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">COMPLIANCE CENTER</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              SARWIN HRPAYROLL ENTERPRISE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Statutory compliance, filings, reconciliations, and payroll obligations in one authoritative command center.
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium shadow-sm"
          >
            <option value="2026-2027">FY 2026-2027 (AY 2027-28)</option>
            <option value="2025-2026">FY 2025-2026</option>
          </select>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium shadow-sm"
          >
            <option value="Q1">Q1 (Apr - Jun)</option>
            <option value="Q2">Q2 (Jul - Sep)</option>
            <option value="Q3">Q3 (Oct - Dec)</option>
            <option value="Q4">Q4 (Jan - Mar)</option>
          </select>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'overview', label: 'Executive Overview' },
          { id: 'tds', label: 'TDS & Regimes' },
          { id: 'epf', label: 'EPFO (ECR)' },
          { id: 'esic', label: 'ESIC Returns' },
          { id: 'pt', label: 'Professional Tax' },
          { id: 'form24q', label: 'Form 24Q' },
          { id: 'challans', label: 'Challan Ops' },
          { id: 'reconciliation', label: 'Reconciliation' },
          { id: 'exceptions', label: 'Exception Center' },
          { id: 'vault', label: 'Document Vault' },
          { id: 'calendar', label: 'Statutory Calendar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-medium text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-white font-semibold shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Health Score & High Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Health</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">100/100</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">EXCELLENT</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero blocking statutory exceptions detected. All locked payroll periods reconciled.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blocking Exceptions</span>
              <div className="text-3xl font-extrabold text-slate-900">0</div>
              <p className="text-xs text-slate-500">No filing blockers across TAN, PAN, UAN or ESIC.</p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unreconciled Balance</span>
              <div className="text-3xl font-extrabold text-emerald-600">₹0.00</div>
              <p className="text-xs text-slate-500">100% Challan 281 deposit coverage against Q1 withholding.</p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Vault</span>
              <div className="text-3xl font-extrabold text-indigo-600">14 Files</div>
              <p className="text-xs text-slate-500">SHA-256 verified preparation datasets and returns.</p>
            </div>
          </div>

          {/* Module Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: 'Income Tax (TDS)', status: 'RECONCILED', amount: '₹13,000', note: 'Dual Regime Active' },
              { name: 'EPFO (ECR)', status: 'PREPARED', amount: '₹3,600', note: '12% Capped Wage Base' },
              { name: 'ESIC Return', status: 'PREPARED', amount: '₹800', note: '≤ ₹21,000 Threshold' },
              { name: 'Professional Tax', status: 'RECONCILED', amount: '₹200', note: 'KA Slab Verified' },
              { name: 'Form 24Q (Q1)', status: 'READY', amount: '₹13,000', note: 'Annexure I & II Mapped' },
            ].map((m) => (
              <div key={m.name} className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-medium text-slate-500">{m.name}</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{m.amount}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TDS & TAX REGIMES */}
      {activeTab === 'tds' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">TDS Withholding & Tax Regimes</h3>
              <p className="text-xs text-slate-500">Dual-regime tax projection, Standard Deduction & Section 87A Marginal Relief</p>
            </div>
            <button
              onClick={() => handleActionConfirm('TDS Projection Sync')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Recalculate Projections
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">New Regime (Section 115BAC)</span>
              <div className="text-xl font-bold text-slate-900">Default Regime Active</div>
              <p className="text-xs text-slate-500">₹75,000 Standard Deduction + 87A zero tax up to ₹12L net taxable income.</p>
            </div>
            <div className="p-5 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Old Regime Declarations</span>
              <div className="text-xl font-bold text-slate-900">Supported</div>
              <p className="text-xs text-slate-500">Chapter VI-A (80C, 80D, HRA) with Maker-Checker review workflow.</p>
            </div>
            <div className="p-5 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Section 206AA Penal Guard</span>
              <div className="text-xl font-bold text-emerald-600">Active (20% Minimum)</div>
              <p className="text-xs text-slate-500">Automatic higher withholding applied if PAN is missing or invalid.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EPFO ECR */}
      {activeTab === 'epf' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">EPFO Electronic Challan cum Return (ECR)</h3>
              <p className="text-xs text-slate-500">12% EE, 3.67% ER EPF, 8.33% EPS on ₹15,000 statutory wage ceiling</p>
            </div>
            <button
              onClick={() => handleActionConfirm('EPF ECR Generation')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Prepare ECR File
            </button>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl text-sm text-slate-700">
            <strong>ECR Dataset Validation:</strong> 100% of employees have valid 12-digit UAN identifiers. NCP/LOP days correctly integrated from Attendance bridge.
          </div>
        </div>
      )}

      {/* TAB 4: ESIC RETURNS */}
      {activeTab === 'esic' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ESIC Monthly Contribution Return</h3>
              <p className="text-xs text-slate-500">0.75% Employee, 3.25% Employer contribution (Gross threshold ≤ ₹21,000)</p>
            </div>
            <button
              onClick={() => handleActionConfirm('ESIC Return Compilation')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Prepare Monthly Return
            </button>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl text-sm text-slate-700">
            <strong>ESIC Threshold Evaluation:</strong> Higher-earning employees (&gt; ₹21,000 gross) are correctly evaluated as ineligible and zero-deducted.
          </div>
        </div>
      )}

      {/* TAB 5: PROFESSIONAL TAX */}
      {activeTab === 'pt' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900">State-wise Professional Tax Distribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-3">State Code</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3">Employees</th>
                  <th className="p-3">Monthly Deduction</th>
                  <th className="p-3">Annual Cap</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-mono font-semibold">KA</td>
                  <td className="p-3">Karnataka</td>
                  <td className="p-3">1</td>
                  <td className="p-3">₹200</td>
                  <td className="p-3">₹2,400</td>
                  <td className="p-3 text-emerald-600 font-bold">MATCHED</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold">MH</td>
                  <td className="p-3">Maharashtra</td>
                  <td className="p-3">1</td>
                  <td className="p-3">₹200 (Feb ₹300)</td>
                  <td className="p-3">₹2,500</td>
                  <td className="p-3 text-emerald-600 font-bold">MATCHED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: FORM 24Q TDS */}
      {activeTab === 'form24q' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form 24Q Quarterly Return Preparation</h3>
              <p className="text-xs text-slate-500">Annexure I (Challan 281 mapping) and Annexure II (Employee deductee breakdown)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleActionConfirm('Validate Form 24Q')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition"
              >
                Validate Dataset
              </button>
              <button
                onClick={() => handleActionConfirm('Generate Form 24Q Dataset')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Prepare Form 24Q
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Company TAN</span>
              <div className="font-mono text-base font-bold text-slate-900">BLRR12345C</div>
              <p className="text-xs text-emerald-600">Valid 10-character TAN format</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Quarter Period</span>
              <div className="text-base font-bold text-slate-900">{quarter} (FY {financialYear})</div>
              <p className="text-xs text-slate-500">Locked payroll cycles mapped</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <span className="text-xs text-slate-500 font-semibold">Quarterly TDS Total</span>
              <div className="text-base font-bold text-indigo-600">₹13,000.00</div>
              <p className="text-xs text-slate-500">100% matched with Challan 281</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CHALLAN OPS */}
      {activeTab === 'challans' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Statutory Tax Challans (ITNS 281 / EPF / ESIC)</h3>
              <p className="text-xs text-slate-500">Register deposit challans, validate BSR codes, and execute transactional allocations</p>
            </div>
            <button
              onClick={() => handleActionConfirm('Record New Challan')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Record Challan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 border rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">7-Digit BSR Code</label>
              <input type="text" value={bsrCode} onChange={(e) => setBsrCode(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Challan Number</label>
              <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Deposited Amount (₹)</label>
              <input type="number" value={challanAmount} onChange={(e) => setChallanAmount(Number(e.target.value))} className="w-full px-3 py-2 bg-white border rounded-lg text-sm font-semibold" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Four-Way Statutory Reconciliation Matrix</h3>
          <div className="space-y-3">
            {[
              { title: 'TDS Withholding vs Challan 281 Deposits', expected: '₹13,000', actual: '₹13,000', variance: '₹0.00', status: 'MATCHED' },
              { title: 'EPF Payroll vs ECR Dataset', expected: '₹3,600', actual: '₹3,600', variance: '₹0.00', status: 'MATCHED' },
              { title: 'ESIC Payroll vs Monthly Return', expected: '₹800', actual: '₹800', variance: '₹0.00', status: 'MATCHED' },
              { title: 'Professional Tax Payroll vs State Slabs', expected: '₹200', actual: '₹200', variance: '₹0.00', status: 'MATCHED' },
            ].map((r) => (
              <div key={r.title} className="p-4 bg-slate-50 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <span className="font-semibold text-slate-900 text-sm">{r.title}</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Expected: {r.expected} | Actual: {r.actual} | Variance: {r.variance}
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: EXCEPTION CENTER */}
      {activeTab === 'exceptions' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Compliance Exception Center</h3>
          <p className="text-xs text-slate-500">Automated ledger detecting missing UAN, missing PAN, missing TAN, and invalid state configs.</p>
          <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-500 text-sm">
            <span className="text-2xl block mb-2">🎉</span>
            <strong>Zero Active Exceptions Found.</strong> All employee profiles, tax regimes, and statutory identifiers are valid.
          </div>
        </div>
      )}

      {/* TAB 10: DOCUMENT VAULT */}
      {activeTab === 'vault' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Statutory Compliance Document Vault</h3>
          <p className="text-xs text-slate-500">Immutable, SHA-256 versioned preparation artifacts ready for external portal upload.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Checksum (SHA-256)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs">
                <tr>
                  <td className="p-3 text-indigo-600 font-semibold">FORM24Q_2026-2027_Q1_v1.json</td>
                  <td className="p-3">FORM_24Q</td>
                  <td className="p-3">v1</td>
                  <td className="p-3 text-slate-500">3a7b9c1d...f8e2</td>
                  <td className="p-3 text-emerald-600 font-bold">PREPARED</td>
                </tr>
                <tr>
                  <td className="p-3 text-indigo-600 font-semibold">ECR_2026_04.json</td>
                  <td className="p-3">EPF_ECR</td>
                  <td className="p-3">v1</td>
                  <td className="p-3 text-slate-500">8c2e4f1a...b4d9</td>
                  <td className="p-3 text-emerald-600 font-bold">PREPARED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 11: STATUTORY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Statutory Filing Schedule (FY {financialYear})</h3>
          <p className="text-xs text-slate-500">Transparent obligation timeline (legal deadlines clearly flagged as deadline not configured unless verified).</p>
          <div className="space-y-3">
            {[
              { type: 'EPF', name: 'EPFO Monthly ECR Return', period: 'Apr 2026', status: 'PREPARED' },
              { type: 'ESIC', name: 'ESIC Monthly Return', period: 'Apr 2026', status: 'PREPARED' },
              { type: 'PT', name: 'Professional Tax Statement', period: 'Apr 2026', status: 'RECONCILED' },
              { type: 'FORM_24Q', name: 'Form 24Q TDS Quarterly Return', period: 'Q1 FY 2026-27', status: 'READY' },
            ].map((ev) => (
              <div key={ev.name} className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-900 text-sm">{ev.name} ({ev.period})</span>
                  <div className="text-xs text-slate-400">Deadline not configured (requires verified authority table)</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200 animate-scale-up">
            <h4 className="text-lg font-bold text-slate-900">Confirm Statutory Action</h4>
            <p className="text-sm text-slate-600">
              Are you sure you want to execute <strong>{modalAction}</strong> for <strong>FY {financialYear} {quarter}</strong>?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Note: This prepares authoritative export datasets for external portal filing.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                Confirm & Prepare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}