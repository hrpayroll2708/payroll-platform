'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PayslipsArchivePage() {
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const mockPayslips = [
    { id: 'REC-01', month: 'August 2026', gross: 100000, basic: 50000, hra: 20000, special: 30000, epf: 1800, pt: 200, tds: 6600, net: 91400, days: 30 },
    { id: 'REC-02', month: 'July 2026', gross: 100000, basic: 50000, hra: 20000, special: 30000, epf: 1800, pt: 200, tds: 6600, net: 91400, days: 31 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Payslip Archive</h1>
          <p className="text-sm text-slate-500">Historical payslips generated from locked payroll records.</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Pay Period</th>
              <th className="p-4">Earned Gross</th>
              <th className="p-4">Statutory Deductions</th>
              <th className="p-4">Net Salary</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockPayslips.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-semibold text-slate-900">{p.month}</td>
                <td className="p-4">₹{p.gross.toLocaleString('en-IN')}</td>
                <td className="p-4 text-red-600">₹{(p.epf + p.pt + p.tds).toLocaleString('en-IN')}</td>
                <td className="p-4 font-bold text-emerald-600">₹{p.net.toLocaleString('en-IN')}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedRecord(p)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                  >
                    View Breakdown
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Payslip Breakdown • {selectedRecord.month}</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Earnings</span>
                <div className="flex justify-between"><span>Basic:</span><span className="font-semibold">₹{selectedRecord.basic.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>HRA:</span><span className="font-semibold">₹{selectedRecord.hra.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Special:</span><span className="font-semibold">₹{selectedRecord.special.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Deductions</span>
                <div className="flex justify-between"><span>EPF (12%):</span><span className="font-semibold">₹{selectedRecord.epf.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>PT:</span><span className="font-semibold">₹{selectedRecord.pt.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>TDS:</span><span className="font-semibold">₹{selectedRecord.tds.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl flex justify-between items-center text-emerald-900 font-bold text-base">
              <span>Net Take-Home Pay:</span>
              <span>₹{selectedRecord.net.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}