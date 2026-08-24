'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeeHelpdeskPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('Payslip TDS Calculation Query');
  const [description, setDescription] = useState<string>('Could you please clarify the tax deduction breakdown for August 2026?');
  const [notice, setNotice] = useState<string | null>(null);

  const mockTickets = [
    { id: 'TICK-01', ref: 'TICK-8921-412', dept: 'PAYROLL', priority: 'HIGH', status: 'IN_PROGRESS', date: 'Aug 24, 2026', subject: 'Payslip TDS Calculation Query' },
  ];

  const handleCreateTicket = () => {
    setIsModalOpen(false);
    setNotice('Ticket created successfully and routed to Payroll department.');
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">HR Helpdesk & Employee Grievance Portal</h1>
          <p className="text-sm text-slate-500">Raise support tickets for Payroll, HR, IT, Tax, and Facilities inquiries.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          + Raise Ticket
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium">
          ✓ {notice}
        </div>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Department</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Created Date</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockTickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-mono font-bold text-slate-900">{t.ref}</td>
                <td className="p-4 font-semibold text-slate-900">{t.subject}</td>
                <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">{t.dept}</span></td>
                <td className="p-4 text-xs font-bold text-amber-600">{t.priority}</td>
                <td className="p-4 text-xs text-slate-500">{t.date}</td>
                <td className="p-4 text-right">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Create Support Ticket</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select className="w-full px-3 py-2 bg-white border rounded-xl text-sm">
                <option>PAYROLL</option>
                <option>HR</option>
                <option>IT</option>
                <option>TAX</option>
                <option>FACILITIES</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm h-24" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleCreateTicket} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Submit Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}