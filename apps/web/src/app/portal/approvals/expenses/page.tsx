'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ManagerExpenseApprovalsPage() {
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const handleReview = (name: string, action: string) => {
    setReviewNotice(`Claim for ${name} has been ${action}. Integrated with payroll adjustment queue.`);
    setTimeout(() => setReviewNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal/approvals" className="text-xs font-semibold text-indigo-600 hover:underline">← Manager Queue</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Expense & Reimbursement Review Workbench</h1>
          <p className="text-sm text-slate-500">Review team expense claims, inspect receipts, and execute full or partial approvals.</p>
        </div>
      </div>

      {reviewNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium">
          ✓ {reviewNotice}
        </div>
      )}

      <div className="space-y-4">
        <div className="p-6 bg-white border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase">Telephone & Internet Reimbursement</span>
            <div className="font-bold text-slate-900 text-base mt-0.5">Subordinate Rohan (EMP-SUB-01)</div>
            <p className="text-xs text-slate-500 mt-0.5">Claimed: ₹2,500 • Bill #ACT-98721 • Attached: Receipt.pdf (SHA-256 Verified)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleReview('Rohan', 'REJECTED')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Reject
            </button>
            <button
              onClick={() => handleReview('Rohan', 'PARTIALLY APPROVED')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold"
            >
              Partial Approve
            </button>
            <button
              onClick={() => handleReview('Rohan', 'APPROVED (₹2,500)')}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Approve Full
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}