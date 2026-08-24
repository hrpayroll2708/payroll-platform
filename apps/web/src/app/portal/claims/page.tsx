'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeeClaimsPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'fbp'>('claims');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [claimAmount, setClaimAmount] = useState<number>(3500);
  const [claimDesc, setClaimDesc] = useState<string>('August Broadband and Mobile Reimbursement');
  const [notice, setNotice] = useState<string | null>(null);

  const mockClaims = [
    { id: 'CLM-01', head: 'Telephone & Internet', amount: 2500, approved: 2500, status: 'APPROVED', date: 'Aug 15, 2026', payroll: 'Aug 2026' },
    { id: 'CLM-02', head: 'Fuel & Conveyance', amount: 4200, approved: 3500, status: 'PARTIALLY_APPROVED', date: 'Aug 18, 2026', payroll: 'Aug 2026' },
  ];

  const handleCreateClaim = () => {
    setIsModalOpen(false);
    setNotice(`Draft claim created for ₹${claimAmount}. Upload receipt and submit for manager review.`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Flexible Benefits & Reimbursement Claims</h1>
          <p className="text-sm text-slate-500">Submit monthly tax-exempt allowance claims and track Flexible Benefit Plan (FBP) limits.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          + New Claim
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium animate-fade-in">
          ✓ {notice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'claims' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          My Expense Claims
        </button>
        <button
          onClick={() => setActiveTab('fbp')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'fbp' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          FBP Entitlements
        </button>
      </div>

      {activeTab === 'claims' && (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Expense Head</th>
                <th className="p-4">Claimed Amount</th>
                <th className="p-4">Approved Amount</th>
                <th className="p-4">Claim Date</th>
                <th className="p-4">Payroll Cycle</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockClaims.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{c.head}</td>
                  <td className="p-4 font-semibold">₹{c.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-emerald-600">₹{c.approved.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-xs text-slate-500">{c.date}</td>
                  <td className="p-4 text-xs font-mono text-indigo-600">{c.payroll}</td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'fbp' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fuel & Conveyance</span>
            <div className="text-2xl font-bold text-slate-900">₹60,000 / Year</div>
            <p className="text-xs text-slate-500">Monthly cap: ₹5,000 • Tax-exempt with fuel bills</p>
          </div>
          <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Telephone & Internet</span>
            <div className="text-2xl font-bold text-slate-900">₹30,000 / Year</div>
            <p className="text-xs text-slate-500">Monthly cap: ₹2,500 • Tax-exempt with broadband bill</p>
          </div>
          <div className="p-6 bg-white border rounded-2xl space-y-2 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Books & Periodicals</span>
            <div className="text-2xl font-bold text-slate-900">₹18,000 / Year</div>
            <p className="text-xs text-slate-500">Monthly cap: ₹1,500 • Skill development materials</p>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Submit Reimbursement Claim</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Head</label>
              <select className="w-full px-3 py-2 bg-white border rounded-xl text-sm">
                <option>Telephone & Internet Reimbursement</option>
                <option>Fuel & Conveyance Allowance</option>
                <option>Books & Periodicals</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Claimed (₹)</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Bill Number</label>
              <input
                type="text"
                value={claimDesc}
                onChange={(e) => setClaimDesc(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
              Drag & Drop PDF or JPEG receipt proof (Max 5MB)
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateClaim} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
                Save & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}