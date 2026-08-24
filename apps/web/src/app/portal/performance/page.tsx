'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeePerformancePortal() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>('Exceed Q3 API Latency Target');
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Performance & OKRs Portal</h1>
          <p className="text-sm text-slate-500">Track objectives, key results, self-evaluations, and appraisal cycles.</p>
        </div>
        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          + Add Goal
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium">
          ✓ {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border rounded-2xl space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Active Performance Cycle</h3>
          <p className="text-sm font-semibold text-indigo-600">FY 2026-2027 Annual Appraisal</p>
          <p className="text-xs text-slate-500">Status: <span className="font-bold text-amber-600">APPRAISAL_PHASE</span></p>
        </div>

        <div className="p-6 bg-white border rounded-2xl space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">My Key Objectives (OKRs)</h3>
          <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
            <span className="text-xs font-bold text-slate-700">Exceed Q3 API Latency Target</span>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-3/4"></div>
            </div>
            <span className="text-[10px] text-slate-500">Progress: 75% | Weightage: 50%</span>
          </div>
        </div>
      </div>

      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Create New Goal</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Goal Title</label>
              <input type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-semibold" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsGoalModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => { setIsGoalModalOpen(false); setNotice('New goal created successfully.'); setTimeout(() => setNotice(null), 4000); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}