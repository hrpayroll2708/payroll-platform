'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ExecutiveAnalyticsDashboard() {
  const [financialYear, setFinancialYear] = useState<string>('2026-2027');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">EXECUTIVE HR & PAYROLL ANALYTICS</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              SARWIN HRPAYROLL ENTERPRISE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Workforce KPIs, payroll burn, compliance posture, and custom report builder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analytics/reports"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            Custom Report Builder
          </Link>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium shadow-xs"
          >
            <option value="2026-2027">FY 2026-2027</option>
            <option value="2025-2026">FY 2025-2026</option>
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Headcount</span>
          <div className="text-3xl font-extrabold text-slate-900">4 Active</div>
          <p className="text-xs text-emerald-600 font-medium">100% UAN & PAN Verified</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Gross Payroll</span>
          <div className="text-3xl font-extrabold text-indigo-600">₹3,20,000</div>
          <p className="text-xs text-slate-500">Locked August 2026 Cycle</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Compliance Health</span>
          <div className="text-3xl font-extrabold text-emerald-600">100 / 100</div>
          <p className="text-xs text-slate-500">Zero blocking audit exceptions</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Attrition Rate</span>
          <div className="text-3xl font-extrabold text-slate-900">0.0%</div>
          <p className="text-xs text-slate-500">Stable workforce retention</p>
        </div>
      </div>
    </div>
  );
}