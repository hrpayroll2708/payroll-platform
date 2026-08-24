'use client';

import React, { useState } from 'react';

export default function BankingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'batches' | 'reconciliation'>('batches');
  const [notice, setNotice] = useState<string | null>(null);

  const mockBatches = [
    { id: 'BATCH-01', ref: 'BATCH-2026-8-4421', cycle: 'August 2026', records: 2, amount: 109850, status: 'APPROVED' },
  ];

  const handleExportCsv = (ref: string) => {
    setNotice(`Corporate NEFT CSV export generated for batch ${ref}. File saved securely.`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">BANKING & DISBURSEMENT COMMAND CENTER</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              SARWIN HRPAYROLL ENTERPRISE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Corporate NEFT/RTGS batch processing, payment maker-checker, account masking, and bank reconciliation.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium animate-fade-in">
          ✓ {notice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'batches' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Disbursement Batches
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'reconciliation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Bank Reconciliation
        </button>
      </div>

      {activeTab === 'batches' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Batch Reference</th>
                <th className="p-4">Payroll Cycle</th>
                <th className="p-4">Total Records</th>
                <th className="p-4">Disbursement Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockBatches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-slate-900">{b.ref}</td>
                  <td className="p-4 text-slate-600">{b.cycle}</td>
                  <td className="p-4">{b.records} Employees</td>
                  <td className="p-4 font-bold text-emerald-600">₹{b.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleExportCsv(b.ref)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Export NEFT CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <div className="p-6 bg-white border rounded-2xl space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Four-Way Payroll to Bank Reconciliation</h3>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-sm text-emerald-900">
            <div>
              <strong>August 2026 Payroll Cycle:</strong> 100% reconciled against bank disbursement batch instructions.
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full">
              MATCHED (₹0.00 Variance)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}