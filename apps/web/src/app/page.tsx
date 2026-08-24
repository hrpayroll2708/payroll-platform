"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://payroll-platform-i9rn.onrender.com";

export default function KredilyApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState(null);

  const [newEmp, setNewEmp] = useState({
    name: "",
    email: "",
    department: "Engineering",
    designation: "Software Engineer",
    monthlyGross: "65000",
    pan: "ABCDE1234F",
    uan: "100998877665",
    bankAccount: "98765432101",
    ifsc: "HDFC0001234"
  });

  const [payrollData, setPayrollData] = useState(null);
  const [lopRecords, setLopRecords] = useState({});
  const [payrollStep, setPayrollStep] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/employees`);
      if (res.ok) setEmployees(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmp)
      });
      if (res.ok) {
        setModalOpen(false);
        setNewEmp({
          name: "",
          email: "",
          department: "Engineering",
          designation: "Software Engineer",
          monthlyGross: "65000",
          pan: "ABCDE1234F",
          uan: "100998877665",
          bankAccount: "98765432101",
          ifsc: "HDFC0001234"
        });
        fetchEmployees();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payroll/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: 8, year: 2026, lopRecords })
      });
      if (res.ok) {
        const data = await res.json();
        setPayrollData(data);
        setPayrollStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadNeftFile = () => {
    if (!payrollData) return;
    const header = "Bene_Account_No,IFSC_Code,Amount,Bene_Name,Remarks\n";
    const rows = payrollData.calculations.map(
      (c) => `${c.bankAccount},${c.ifsc},${c.netSalary},${c.name},Salary Aug 2026`
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "NEFT_Salary_Disbursement_Aug_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased overflow-hidden">
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
              K
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white">kredily</h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise HRMS</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 text-sm font-medium">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "dashboard" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "employees" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Employee Directory
            </button>
            <button
              onClick={() => setActiveTab("payroll")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "payroll" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Payroll Processing
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                activeTab === "attendance" ? "bg-indigo-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Attendance & Leaves
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 border border-slate-600">
            HR
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Payroll Administrator</p>
            <p className="text-[11px] text-slate-400 truncate">admin@company.com</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Active Cycle: August 2026
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow"
            >
              + Add Employee
            </button>
            <button
              onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow"
            >
              Process Payroll
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="p-8 space-y-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Headcount</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-900">{stats?.totalEmployees || employees.length}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Active</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monthly Gross Payroll</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ?{(stats?.monthlyGrossPayroll || 345000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Statutory Liability</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ?{(stats?.statutoryLiability || 48000).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-indigo-600 font-medium">EPF + ESIC</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compliance Status</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-emerald-600">Compliant</span>
                  <span className="text-xs font-medium text-slate-500">PT & TDS ready</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Active Employee Roster</h3>
                <button onClick={() => setActiveTab("employees")} className="text-xs font-semibold text-indigo-600 hover:underline">
                  View Directory ?
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3 text-right">Monthly Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.slice(0, 5).map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5 font-mono text-slate-500">{emp.employeeCode}</td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">{emp.name}</td>
                        <td className="px-6 py-3.5 text-slate-600">{emp.department}</td>
                        <td className="px-6 py-3.5 text-right font-mono font-medium text-slate-900">
                          ?{emp.monthlyGross?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="p-8 space-y-6 max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Employee Directory</h2>
                <p className="text-xs text-slate-500">Manage employee roster and statutory parameters.</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow">
                + Add New Employee
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Code</th>
                      <th className="px-5 py-3.5">Full Name</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">PAN / UAN</th>
                      <th className="px-5 py-3.5">Bank / IFSC</th>
                      <th className="px-5 py-3.5 text-right">Monthly Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono text-slate-500">{emp.employeeCode}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{emp.name}</td>
                        <td className="px-5 py-3.5 text-slate-600">{emp.department}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{emp.pan}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{emp.bankAccount}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">?{emp.monthlyGross?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <h2 className="text-lg font-bold text-slate-900">Attendance & LOP (August 2026 - 31 Days)</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">LOP / Unpaid Days</th>
                    <th className="px-6 py-3.5 text-right">Payable Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const lop = Number(lopRecords[emp.id]) || 0;
                    return (
                      <tr key={emp.id}>
                        <td className="px-6 py-4 font-semibold text-slate-900">{emp.name}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={lopRecords[emp.id] || 0}
                            onChange={(e) => setLopRecords({ ...lopRecords, [emp.id]: e.target.value })}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-700">{31 - lop} Days</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="p-8 space-y-6 max-w-7xl">
            {payrollStep === 1 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-5">
                <h3 className="text-lg font-bold text-slate-900">Run Statutory Payroll for August 2026</h3>
                <button
                  disabled={loading}
                  onClick={handleRunPayroll}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg w-full disabled:opacity-50"
                >
                  {loading ? "Computing Compliances..." : "Compute August Payroll Cycle"}
                </button>
              </div>
            )}

            {payrollStep >= 2 && payrollData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Gross Pay</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">?{payrollData.summary.totalGross.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Total EPF & ESIC</p>
                    <p className="text-xl font-extrabold text-indigo-600 mt-1">?{(payrollData.summary.totalEpf + payrollData.summary.totalEsic).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">TDS & PT</p>
                    <p className="text-xl font-extrabold text-amber-600 mt-1">?{(payrollData.summary.totalTds + payrollData.summary.totalPt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Net Payout</p>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">?{payrollData.summary.totalNetPayout.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Payroll Register</h4>
                    <button onClick={downloadNeftFile} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow">
                      Download NEFT Bank Batch
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3 text-right">Gross</th>
                          <th className="px-4 py-3 text-right">EPF (12%)</th>
                          <th className="px-4 py-3 text-right">PT</th>
                          <th className="px-4 py-3 text-right font-bold">Net Salary</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payrollData.calculations.map((c) => (
                          <tr key={c.employeeId}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                            <td className="px-4 py-3 text-right font-mono">?{c.earnings.gross.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right font-mono">?{c.deductions.epfEmployee}</td>
                            <td className="px-4 py-3 text-right font-mono">?{c.deductions.pt}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">?{c.netSalary.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => setPayslipModalData(c)} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded border border-indigo-200">
                                Payslip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {payslipModalData && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <h3 className="font-bold text-base text-slate-900 border-b pb-2">Payslip - August 2026</h3>
            <p className="text-xs">Employee: <strong>{payslipModalData.name}</strong> ({payslipModalData.employeeCode})</p>
            <div className="flex justify-between text-xs py-2 border-y">
              <span>Gross Earnings: ?{payslipModalData.earnings.gross}</span>
              <span>Deductions: ?{payslipModalData.deductions.totalDeductions}</span>
              <span className="font-bold text-emerald-700">Net Pay: ?{payslipModalData.netSalary}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">Print</button>
              <button onClick={() => setPayslipModalData(null)} className="px-3 py-1.5 border rounded text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
