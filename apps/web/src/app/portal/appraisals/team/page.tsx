'use client';

import React from 'react';
import Link from 'next/link';

export default function ManagerAppraisalsWorkbench() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Direct Report Appraisals Workbench</h1>
          <p className="text-sm text-slate-500">Conduct performance evaluations, ratings, feedback, and merit increment recommendations.</p>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Direct Report</th>
              <th className="p-4">Cycle</th>
              <th className="p-4">Self Rating</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50 transition">
              <td className="p-4 font-bold text-slate-900">Rohan Sharma (EMP-SUB-01)</td>
              <td className="p-4 text-slate-600">FY 2026-2027 Annual Appraisal</td>
              <td className="p-4 font-semibold text-indigo-600">4.5 / 5.0</td>
              <td className="p-4"><span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">SELF_SUBMITTED</span></td>
              <td className="p-4 text-right">
                <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700">
                  Conduct Review
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}