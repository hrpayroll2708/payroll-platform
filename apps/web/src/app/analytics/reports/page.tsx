'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CustomReportBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('PAYROLL_REGISTER');
  const [reportResult, setReportResult] = useState<any[] | null>(null);

  const handleRunReport = () => {
    setReportResult([
      { code: 'EMP-01', name: 'Raghavan Pillai', department: 'Engineering', gross: 100000, net: 91400 },
      { code: 'EMP-02', name: 'Ananya Deshmukh', department: 'Product', gross: 20000, net: 18450 },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/analytics" className="text-xs font-semibold text-indigo-600 hover:underline">← Executive Analytics</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Custom Report Builder & Predefined Templates</h1>
          <p className="text-sm text-slate-500">Generate authoritative workforce, payroll, and compliance reports with CSV/Excel export.</p>
        </div>
      </div>

      <div className="p-6 bg-white border rounded-2xl space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Select Report Template</h3>
        <div className="flex gap-4">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-4 py-2.5 bg-white border rounded-xl text-sm font-medium w-96 shadow-xs"
          >
            <option value="PAYROLL_REGISTER">Authoritative Payroll Register</option>
            <option value="EMP_MASTER">Employee Master Directory</option>
            <option value="FNF_REPORT">Full & Final Settlement Register</option>
          </select>
          <button
            onClick={handleRunReport}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            Run Report
          </button>
        </div>
      </div>

      {reportResult && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Employee Code</th>
                <th className="p-4">Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Gross Salary</th>
                <th className="p-4">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportResult.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-semibold">{r.code}</td>
                  <td className="p-4 font-bold text-slate-900">{r.name}</td>
                  <td className="p-4 text-slate-600">{r.department}</td>
                  <td className="p-4">₹{r.gross.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-emerald-600">₹{r.net.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}