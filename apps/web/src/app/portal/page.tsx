'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeePortalDashboard() {
  const [greeting] = useState<string>('Good morning, Raghavan');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Employee Self-Service</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{greeting}</h1>
          <p className="text-sm text-slate-500 mt-1">Senior Software Engineer • Engineering • Bengaluru Campus</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portal/payslips"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            View Latest Payslip
          </Link>
          <Link
            href="/portal/approvals"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
          >
            Manager Queue
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Net Pay</span>
          <div className="text-3xl font-extrabold text-slate-900">₹91,400</div>
          <p className="text-xs text-emerald-600 font-medium">Disbursed on Aug 07, 2026</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Paid Leave Balance</span>
          <div className="text-3xl font-extrabold text-indigo-600">14.5 Days</div>
          <p className="text-xs text-slate-500">1.5 days accrued this month</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Attendance (Aug)</span>
          <div className="text-3xl font-extrabold text-slate-900">22 / 22</div>
          <p className="text-xs text-slate-500">100% Present • 0 LOP</p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tax Regime</span>
          <div className="text-3xl font-extrabold text-slate-900">New Regime</div>
          <p className="text-xs text-slate-500">Section 115BAC Active</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/portal/payslips" className="p-6 bg-white border border-slate-200/80 rounded-2xl hover:border-indigo-500 transition group space-y-2">
          <div className="text-indigo-600 text-2xl font-bold">📄</div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Payslips & Tax Forms</h3>
          <p className="text-xs text-slate-500">Download signed payslips, Form 16 Part A/B, and yearly earnings statements.</p>
        </Link>

        <Link href="/portal/leave" className="p-6 bg-white border border-slate-200/80 rounded-2xl hover:border-indigo-500 transition group space-y-2">
          <div className="text-indigo-600 text-2xl font-bold">🌴</div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Leave Management</h3>
          <p className="text-xs text-slate-500">Apply for annual, sick, or casual leave and track manager approval status.</p>
        </Link>

        <Link href="/portal/attendance" className="p-6 bg-white border border-slate-200/80 rounded-2xl hover:border-indigo-500 transition group space-y-2">
          <div className="text-indigo-600 text-2xl font-bold">⏰</div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">Attendance Regularization</h3>
          <p className="text-xs text-slate-500">View check-in logs, shifts, and submit biometric miss regularization requests.</p>
        </Link>
      </div>
    </div>
  );
}