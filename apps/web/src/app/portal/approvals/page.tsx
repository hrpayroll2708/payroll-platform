'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ManagerApprovalsPage() {
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleAction = (type: string, name: string, status: string) => {
    setActionMessage(`Request for ${name} has been ${status}. Notification dispatched.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manager Approval Workbench</h1>
          <p className="text-sm text-slate-500">Direct reports review queue (leaves, attendance corrections).</p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium">
          {actionMessage}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800">Pending Leave Requests</h3>
        <div className="p-5 bg-white border rounded-2xl flex justify-between items-center shadow-xs">
          <div>
            <div className="font-bold text-slate-900 text-sm">Ananya Deshmukh (EMP-7F-A02)</div>
            <p className="text-xs text-slate-500">Casual Leave • Sep 01 to Sep 02 (2 Days) • Reason: Personal commitment</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('Leave', 'Ananya Deshmukh', 'REJECTED')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Reject
            </button>
            <button
              onClick={() => handleAction('Leave', 'Ananya Deshmukh', 'APPROVED')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}