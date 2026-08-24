'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeeExitPortalPage() {
  const [isResigned, setIsResigned] = useState<boolean>(false);
  const [proposedLastDay, setProposedLastDay] = useState<string>('2026-09-30');
  const [reason, setReason] = useState<string>('Career Growth Opportunity');

  const handleSubmitResignation = () => {
    setIsResigned(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Separation & Resignation Portal</h1>
          <p className="text-sm text-slate-500">Submit separation requests, monitor notice period, and track exit clearances.</p>
        </div>
      </div>

      {!isResigned ? (
        <div className="max-w-xl bg-white p-8 border rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900">Initiate Resignation</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Proposed Last Working Day</label>
            <input type="date" value={proposedLastDay} onChange={(e) => setProposedLastDay(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <button onClick={handleSubmitResignation} className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm shadow-xs hover:bg-indigo-700 transition">
            Submit Resignation Request
          </button>
        </div>
      ) : (
        <div className="max-w-xl bg-white p-8 border rounded-3xl space-y-4 shadow-xs">
          <div className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full w-max">
            STATUS: ON NOTICE PERIOD
          </div>
          <h3 className="text-xl font-bold text-slate-900">Resignation Formalized</h3>
          <p className="text-xs text-slate-500">Last Working Day Confirmed: {proposedLastDay}. Departmental exit clearance checklist initiated.</p>
        </div>
      )}
    </div>
  );
}