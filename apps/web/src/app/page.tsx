"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://payroll-platform-i9rn.onrender.com";
const INR = "\u20B9";

export default function SarwinHRPayrollApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalData, setProfileModalData] = useState<any>(null);
  const [payslipModalData, setPayslipModalData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newEmp, setNewEmp] = useState({
    name: "",
    email: "",
    department: "Engineering",
    designation: "Software Engineer",
    monthlyGross: "75000",
    pan: "ABCDE1234F",
    uan: "100998877665",
    bankAccount: "98765432101",
    ifsc: "HDFC0001234"
  });

  const [payrollData, setPayrollData] = useState<any>(null);
  const [lopRecords, setLopRecords] = useState<Record<string, any>>({});
  const [payrollStep, setPayrollStep] = useState(1);

  useEffect(() => {
    fetchDashboardStats();
    fetchEmployees();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDashboardStats = async () => {
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

  const handleAddEmployee = async (e: React.FormEvent) => {
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
          monthlyGross: "75000",
          pan: "ABCDE1234F",
          uan: "100998877665",
          bankAccount: "98765432101",
          ifsc: "HDFC0001234"
        });
        await fetchEmployees();
        await fetchDashboardStats();
        showToast("Employee enrolled into SARWIN HRPAYROLL.");
      }
    } catch (err) {
      showToast("Error saving employee.");
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
        setPayrollStep(4);
        showToast("August 2026 Statutory Payroll computed successfully.");
      }
    } catch (err) {
      showToast("Failed to compute payroll.");
    } finally {
      setLoading(false);
    }
  };

  const downloadNeftBatch = () => {
    if (!payrollData) return;
    const header = "Beneficiary_Account_No,IFSC_Code,Disbursement_Amount,Beneficiary_Name,Remarks\n";
    const rows = payrollData.calculations.map(
      (c: any) => `${c.bankAccount},${c.ifsc},${c.netSalary},"${c.name}",Salary August 2026`
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "SARWIN_NEFT_Disbursement_August_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("NEFT Disbursement Batch file downloaded.");
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 font-sans antialiased overflow-hidden">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold flex items-center gap-3 border border-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#090E1A] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-extrabold text-white text-base shadow-lg">
                S
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-wider text-white uppercase leading-none">
                  SARWIN
                </h1>
                <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">
                  HRPAYROLL
                </p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="p-3 space-y-4 text-xs">
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Core Systems</p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "dashboard" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Executive Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "employees" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Employee 360 Directory
                </button>
              </nav>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Time & Payroll</p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "attendance" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Attendance & LOP Matrix
                </button>
                <button
                  onClick={() => setActiveTab("payroll")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "payroll" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Payroll Command Center
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">AUG 26</span>
                </button>
                <button
                  onClick={() => setActiveTab("compliance")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "compliance" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Compliance Hub
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "reports" ? "bg-blue-600 text-white font-bold shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Disbursement Reports
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#060913] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">SARWIN Admin</p>
              <p className="text-[10px] text-slate-400 truncate">admin@sarwinhr.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#F8FAFC] text-slate-800 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-xs font-semibold text-slate-700">
              Active Cycle: <strong className="text-blue-600 font-mono">August 2026 (31 Days)</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
            >
              + Enrol Employee
            </button>
            <button
              onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
            >
              Execute Payroll Run
            </button>
          </div>
        </header>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="p-8 space-y-6 max-w-7xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Payroll Overview</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Real-time statutory computation, headcount distribution, and disbursement metrics for August 2026.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Headcount</p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900">{stats?.totalEmployees || employees.length}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">100% Active</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Monthly Run</p>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {INR}{(stats?.monthlyGrossPayroll || employees.reduce((s: number, e: any) => s + (e.monthlyGross || 0), 0)).toLocaleString("en-IN")}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400 font-medium">Monthly CTC Base Value</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statutory Liability</p>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {INR}{(stats?.statutoryLiability || 48000).toLocaleString("en-IN")}
                  </span>
                  <p className="mt-1 text-[11px] text-amber-600 font-semibold">EPF (12%) + ESIC (3.25%)</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Status</p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-600">100% OK</span>
                  <span className="text-[11px] text-slate-500 font-medium">PT & TDS Ready</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold text-[10px] uppercase">
                  SARWIN Engine Ready
                </span>
                <h3 className="text-lg font-bold">August 2026 Statutory Payroll Cycle</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Prerequisites fulfilled. All employee salary structures and attendance inputs are calibrated for automated statutory settlement.
                </p>
              </div>
              <button
                onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Launch Command Center →
              </button>
            </div>
          </div>
        )}

        {/* Employees */}
        {activeTab === "employees" && (
          <div className="p-8 space-y-6 max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employee 360 Directory</h2>
                <p className="text-xs text-slate-500 font-medium">Manage personnel, salary structures, PAN/UAN credentials, and disbursement bank accounts.</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
              >
                + Enrol New Employee
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search by Employee Code, Name, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department & Role</th>
                    <th className="px-6 py-4">Statutory IDs</th>
                    <th className="px-6 py-4">Bank Account</th>
                    <th className="px-6 py-4 text-right">Monthly Gross</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <p className="font-mono text-[10px] text-blue-600">{emp.employeeCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">{emp.department}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{emp.designation}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                        <div>PAN: {emp.pan}</div>
                        <div>UAN: {emp.uan}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                        <div>{emp.bankAccount}</div>
                        <div className="text-slate-400">{emp.ifsc}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {INR}{emp.monthlyGross?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setProfileModalData(emp)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                        >
                          360° Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance */}
        {activeTab === "attendance" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance & Loss of Pay (LOP)</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Calendar Days</th>
                    <th className="px-6 py-4">Unpaid LOP Days</th>
                    <th className="px-6 py-4 text-right">Computed Payable Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const lop = Number(lopRecords[emp.id]) || 0;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{emp.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">31 Days</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={lopRecords[emp.id] || 0}
                            onChange={(e) => setLopRecords({ ...lopRecords, [emp.id]: e.target.value })}
                            className="w-20 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600 text-sm">
                          {31 - lop} Days
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
            >
              Proceed to Payroll Command Center →
            </button>
          </div>
        )}

        {/* Payroll */}
        {activeTab === "payroll" && (
          <div className="p-8 space-y-6 max-w-7xl">
            {payrollStep < 4 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-5">
                <h3 className="text-xl font-black text-slate-900">Execute August 2026 Payroll Cycle</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  SARWIN engine computes Indian statutory deductions (EPF 12%, ESIC 0.75%, Professional Tax, TDS) across all {employees.length} enrolled employees.
                </p>
                <button
                  disabled={loading}
                  onClick={handleRunPayroll}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Computing Statutory Engine..." : "Execute Automated Payroll Run"}
                </button>
              </div>
            ) : (
              payrollData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Payroll</p>
                      <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                        {INR}{payrollData.summary.totalGross.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Statutory (EPF + ESIC)</p>
                      <p className="text-xl font-black text-indigo-600 mt-1 font-mono">
                        {INR}{(payrollData.summary.totalEpf + payrollData.summary.totalEsic).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">TDS & PT</p>
                      <p className="text-xl font-black text-amber-600 mt-1 font-mono">
                        {INR}{(payrollData.summary.totalTds + payrollData.summary.totalPt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Net Bank Payout</p>
                      <p className="text-xl font-black text-emerald-600 mt-1 font-mono">
                        {INR}{payrollData.summary.totalNetPayout.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase">August 2026 Finalized Payroll Register</h4>
                      <button
                        onClick={downloadNeftBatch}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Download NEFT Bank Batch
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3 text-right">Gross</th>
                            <th className="px-4 py-3 text-right">EPF (12%)</th>
                            <th className="px-4 py-3 text-right">ESIC</th>
                            <th className="px-4 py-3 text-right">PT</th>
                            <th className="px-4 py-3 text-right">TDS</th>
                            <th className="px-4 py-3 text-right font-black">Net Salary</th>
                            <th className="px-4 py-3 text-center">Payslip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payrollData.calculations.map((c: any) => (
                            <tr key={c.employeeId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                              <td className="px-4 py-3 text-right font-mono">{INR}{c.earnings.gross.toLocaleString("en-IN")}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">{INR}{c.deductions.epfEmployee}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">{INR}{c.deductions.esicEmployee}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">{INR}{c.deductions.pt}</td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">{INR}{c.deductions.tds}</td>
                              <td className="px-4 py-3 text-right font-mono font-black text-emerald-600">
                                {INR}{c.netSalary.toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setPayslipModalData(c)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[10px] border border-blue-200"
                                >
                                  View Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Compliance */}
        {activeTab === "compliance" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance & Statutory Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">EPF (12%)</h3>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-slate-600">Employee 12% on Basic (capped at {INR}15,000 ceiling). Employer share divided into EPS (8.33%) & EPF (3.67%).</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">ESIC (0.75% / 3.25%)</h3>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-slate-600">Applicable on gross wages up to {INR}21,000 threshold.</p>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Disbursement Reports</h2>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">NEFT / RTGS Corporate Salary Batch File</h4>
                <p className="text-xs text-slate-500">Corporate banking format for August 2026 disbursement.</p>
              </div>
              <button
                onClick={downloadNeftBatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Export CSV Batch
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Enrol Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Enrol Employee in SARWIN HRPAYROLL</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400"
                />
                <select
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400"
                >
                  <option>Engineering</option>
                  <option>Product & Design</option>
                  <option>Operations</option>
                  <option>Human Resources</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Designation"
                  value={newEmp.designation}
                  onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400"
                />
                <input
                  type="number"
                  required
                  placeholder="Monthly Gross"
                  value={newEmp.monthlyGross}
                  onChange={(e) => setNewEmp({ ...newEmp, monthlyGross: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400 font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="PAN"
                  value={newEmp.pan}
                  onChange={(e) => setNewEmp({ ...newEmp, pan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400 font-mono"
                />
                <input
                  type="text"
                  placeholder="UAN"
                  value={newEmp.uan}
                  onChange={(e) => setNewEmp({ ...newEmp, uan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Bank Account"
                  value={newEmp.bankAccount}
                  onChange={(e) => setNewEmp({ ...newEmp, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400 font-mono"
                />
                <input
                  type="text"
                  placeholder="IFSC"
                  value={newEmp.ifsc}
                  onChange={(e) => setNewEmp({ ...newEmp, ifsc: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white !text-gray-900 placeholder:text-gray-400 font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Enrol</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 Profile Modal */}
      {profileModalData && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">{profileModalData.name} ({profileModalData.employeeCode})</h3>
              <button onClick={() => setProfileModalData(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="text-xs space-y-2 text-slate-700">
              <p>Department: <strong>{profileModalData.department}</strong></p>
              <p>Designation: {profileModalData.designation}</p>
              <p>Monthly Gross: <strong className="font-mono">{INR}{profileModalData.monthlyGross?.toLocaleString("en-IN")}</strong></p>
              <p>PAN: {profileModalData.pan} | UAN: {profileModalData.uan}</p>
              <p>Bank A/C: {profileModalData.bankAccount} ({profileModalData.ifsc})</p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setProfileModalData(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {payslipModalData && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-800" id="sarwin-printable-payslip">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">SARWIN HRPAYROLL</h3>
                <p className="text-[10px] text-slate-500">Official Payslip: August 2026</p>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">PAID</span>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl space-y-1">
              <p>Employee: <strong>{payslipModalData.name}</strong> ({payslipModalData.employeeCode})</p>
              <p>Payable Days: {payslipModalData.payableDays} / 31 Days</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border p-3 rounded-xl space-y-1">
                <p className="font-bold text-blue-700 uppercase text-[10px]">Earnings</p>
                <div className="flex justify-between"><span>Basic:</span><span className="font-mono">{INR}{payslipModalData.earnings.basic.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>HRA:</span><span className="font-mono">{INR}{payslipModalData.earnings.hra.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Special:</span><span className="font-mono">{INR}{payslipModalData.earnings.special.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Total Gross:</span><span className="font-mono">{INR}{payslipModalData.earnings.gross.toLocaleString("en-IN")}</span></div>
              </div>

              <div className="border p-3 rounded-xl space-y-1">
                <p className="font-bold text-amber-700 uppercase text-[10px]">Deductions</p>
                <div className="flex justify-between"><span>EPF (12%):</span><span className="font-mono">{INR}{payslipModalData.deductions.epfEmployee}</span></div>
                <div className="flex justify-between"><span>ESIC:</span><span className="font-mono">{INR}{payslipModalData.deductions.esicEmployee}</span></div>
                <div className="flex justify-between"><span>PT:</span><span className="font-mono">{INR}{payslipModalData.deductions.pt}</span></div>
                <div className="flex justify-between"><span>TDS:</span><span className="font-mono">{INR}{payslipModalData.deductions.tds}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Total Ded.:</span><span className="font-mono">{INR}{payslipModalData.deductions.totalDeductions}</span></div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Net Payout</p>
                <p className="text-xl font-bold font-mono text-emerald-400">{INR}{payslipModalData.netSalary.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Print</button>
                <button onClick={() => setPayslipModalData(null)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
