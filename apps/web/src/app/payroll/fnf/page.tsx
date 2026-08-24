'use client';

import React, { useState } from 'react';

export default function FullAndFinalDashboardPage() {
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

  const mockFnF = [
    {
      id: 'FNF-01',
      employee: 'Rohan Sharma (EMP-SUB-01)',
      lwd: 'Aug 31, 2026',
      salary: 40000,
      leaveEncash: 13333,
      gratuity: 0,
      reimbursements: 2500,
      recoveries: 0,
      netSettlement: 51833,
      status: 'CALCULATED',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Full & Final (F&F) Settlement Command Center</h1>
          <p className="text-sm text-slate-500">Calculate separation settlements, gratuity, leave encashment, and execute maker-checker locks.</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Exiting Employee</th>
              <th className="p-4">Last Working Day</th>
              <th className="p-4">Earned Salary</th>
              <th className="p-4">Leave Encashment</th>
              <th className="p-4">Net Settlement</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockFnF.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-bold text-slate-900">{f.employee}</td>
                <td className="p-4 text-xs text-slate-500">{f.lwd}</td>
                <td className="p-4 font-semibold">₹{f.salary.toLocaleString('en-IN')}</td>
                <td className="p-4 text-indigo-600 font-semibold">₹{f.leaveEncash.toLocaleString('en-IN')}</td>
                <td className="p-4 font-bold text-emerald-600">₹{f.netSettlement.toLocaleString('en-IN')}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">
                    {f.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedSettlement(f)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    View Statement
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSettlement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">F&F Settlement Breakdown</h3>
              <button onClick={() => setSelectedSettlement(null)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Final Month Worked Salary:</span><span className="font-semibold">₹{selectedSettlement.salary.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Leave Encashment:</span><span className="font-semibold">₹{selectedSettlement.leaveEncash.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Approved Reimbursements:</span><span className="font-semibold">₹{selectedSettlement.reimbursements.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold text-emerald-600">
                <span>Net Settlement Payable:</span>
                <span>₹{selectedSettlement.netSettlement.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}