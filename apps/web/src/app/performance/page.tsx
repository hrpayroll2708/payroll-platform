'use client';

import React from 'react';

export default function AdminPerformanceCommandCenter() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Management & Appraisals Command Center</h1>
          <p className="text-sm text-slate-500">Manage review cycles, lifecycle transitions, score normalization, and SalaryRevision merit handoffs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Cycles</span>
          <div className="text-3xl font-extrabold text-slate-900">1 Active</div>
          <p className="text-xs text-indigo-600 font-medium">FY 2026-2027 Annual</p>
        </div>
        <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Pending Appraisals</span>
          <div className="text-3xl font-extrabold text-amber-600">1 Review</div>
          <p className="text-xs text-slate-500">Awaiting manager review</p>
        </div>
        <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Locked Appraisals</span>
          <div className="text-3xl font-extrabold text-emerald-600">0 Locked</div>
          <p className="text-xs text-slate-500">Maker-checker ready</p>
        </div>
      </div>
    </div>
  );
}