'use client';

import React, { useState } from 'react';

export default function AdminHelpdeskWorkbenchPage() {
  const [resolveNotice, setResolveNotice] = useState<string | null>(null);

  const handleResolve = (ref: string) => {
    setResolveNotice(`Ticket ${ref} marked as RESOLVED with resolution notes.`);
    setTimeout(() => setResolveNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Helpdesk & Grievance Management Workbench</h1>
          <p className="text-sm text-slate-500">Manage support queues, assign agents, post internal confidential notes, and resolve tickets.</p>
        </div>
      </div>

      {resolveNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium">
          ✓ {resolveNotice}
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Employee</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Department</th>
              <th className="p-4">Priority</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50 transition">
              <td className="p-4 font-mono font-bold text-slate-900">TICK-8921-412</td>
              <td className="p-4 font-semibold text-slate-900">Rohan Sharma (EMP-SUB-01)</td>
              <td className="p-4 text-slate-700">Payslip TDS Calculation Query</td>
              <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-xs rounded">PAYROLL</span></td>
              <td className="p-4 text-xs font-bold text-amber-600">HIGH</td>
              <td className="p-4 text-right">
                <button
                  onClick={() => handleResolve('TICK-8921-412')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-emerald-700"
                >
                  Resolve Ticket
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}