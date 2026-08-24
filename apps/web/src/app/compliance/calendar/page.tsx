'use client';

import React from 'react';

export default function StandaloneComplianceCalendar() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Statutory Compliance Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Monthly & Quarterly Statutory Filing Schedule (FY 2026-27)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
          <h3 className="font-bold text-slate-900">Monthly Obligations (EPF, ESIC, PT)</h3>
          <p className="text-xs text-slate-500">Compiled on payroll cycle locking. Deadlines marked transparently.</p>
          <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-700 space-y-1">
            <div>• EPF ECR: 15th of following month (Configurable)</div>
            <div>• ESIC Return: 15th of following month (Configurable)</div>
            <div>• PT Statement: State-specific schedule</div>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3">
          <h3 className="font-bold text-slate-900">Quarterly Form 24Q Obligations</h3>
          <p className="text-xs text-slate-500">TDS quarterly statement submission readiness.</p>
          <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-700 space-y-1">
            <div>• Q1 (Apr-Jun): July Preparation Window</div>
            <div>• Q2 (Jul-Sep): October Preparation Window</div>
            <div>• Q3 (Oct-Dec): January Preparation Window</div>
            <div>• Q4 (Jan-Mar): May Preparation Window</div>
          </div>
        </div>
      </div>
    </div>
  );
}