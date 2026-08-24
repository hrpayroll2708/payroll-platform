"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = "https://payroll-platform-i9rn.onrender.com";

export default function SarwinHRPayrollApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalData, setProfileModalData] = useState(null);
  const [payslipModalData, setPayslipModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Employee Form State
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

  // Payroll Command Center State
  const [payrollData, setPayrollData] = useState(null);
  const [lopRecords, setLopRecords] = useState({});
  const [payrollStep, setPayrollStep] = useState(1);

  useEffect(() => {
    fetchDashboardStats();
    fetchEmployees();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
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
          monthlyGross: "75000",
          pan: "ABCDE1234F",
          uan: "100998877665",
          bankAccount: "98765432101",
          ifsc: "HDFC0001234"
        });
        await fetchEmployees();
        await fetchDashboardStats();
        showToast("Employee successfully enrolled in SARWIN roster.");
      }
    } catch (err) {
      showToast("Error saving employee record.");
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
        showToast("August 2026 Statutory Payroll calculated successfully.");
      }
    } catch (err) {
      showToast("Failed to compute statutory payroll cycle.");
    } finally {
      setLoading(false);
    }
  };

  const downloadNeftBatch = () => {
    if (!payrollData) return;
    const header = "Beneficiary_Account_No,IFSC_Code,Disbursement_Amount,Beneficiary_Name,Remarks\n";
    const rows = payrollData.calculations.map(
      (c) => `${c.bankAccount},${c.ifsc},${c.netSalary},"${c.name}",Salary August 2026`
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SARWIN_NEFT_Disbursement_August_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Bank NEFT disbursement batch file downloaded.");
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate Exceptions
  const exceptions = employees.filter(
    (emp) => !emp.bankAccount || !emp.pan || !emp.uan || (emp.monthlyGross || 0) <= 0
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 antialiased overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-3 border border-slate-700 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Enterprise Left Sidebar Shell */}
      <aside className="w-72 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 shadow-2xl border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-black text-white text-xl shadow-lg ring-1 ring-white/20">
                S
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-wider text-white uppercase leading-none">
                  SARWIN
                </h1>
                <p className="text-[10px] font-semibold text-emerald-400 tracking-widest uppercase mt-0.5">
                  HRPAYROLL
                </p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6 text-xs overflow-y-auto max-h-[calc(100vh-170px)]">
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Core Systems
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "dashboard"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Executive Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "employees"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Employee 360 Directory
                </button>
              </nav>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Time & Payroll
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "attendance"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Attendance & LOP Matrix
                </button>
                <button
                  onClick={() => setActiveTab("payroll")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "payroll"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Payroll Command Center
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    AUG 26
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("compliance")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "compliance"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Compliance & Statutory Hub
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === "reports"
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Disbursement & Reports
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* User Identity Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">SARWIN Admin</p>
              <p className="text-[10px] text-slate-400 truncate">admin@sarwinhr.com</p>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
            v2.6
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Global Command Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              SARWIN Enterprise Node: <span className="text-blue-700 font-mono">India Primary (August 2026)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              Enrol Employee
            </button>
            <button
              onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
              Execute Payroll Run
            </button>
          </div>
        </header>

        {/* View 1: Executive Dashboard */}
        {activeTab === "dashboard" && (
          <div className="p-8 space-y-6 max-w-7xl">
            {/* Header Greeting */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Payroll Overview</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Real-time statutory computation, headcount distribution, and disbursement metrics for August 2026.
              </p>
            </div>

            {/* 4 Real-time Executive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-wider">Active Headcount</p>
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {stats?.totalEmployees || employees.length}
                  </span>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    100% Verified Profiles
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-wider">Gross Monthly Run</p>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    ?{(stats?.monthlyGrossPayroll || employees.reduce((s, e) => s + (e.monthlyGross || 0), 0)).toLocaleString("en-IN")}
                  </span>
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">Monthly CTC Base Value</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-wider">Statutory Liability</p>
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    ?{(stats?.statutoryLiability || 48000).toLocaleString("en-IN")}
                  </span>
                  <p className="mt-2 text-[11px] text-amber-700 font-semibold">EPF (12%) + ESIC (3.25%)</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-wider">Compliance Grade</p>
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-emerald-600 tracking-tight">AAA</span>
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">Form 16 & PT Ready</p>
                </div>
              </div>
            </div>

            {/* Launch Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-2xl p-7 text-white flex items-center justify-between shadow-xl border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider">
                    SARWIN Engine Ready
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Cycle ID: 2026-AUG-01</span>
                </div>
                <h3 className="text-xl font-black text-white">August 2026 Statutory Payroll Cycle</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Prerequisites fulfilled. All employee salary structures and attendance inputs are calibrated for automated statutory settlement.
                </p>
              </div>
              <button
                onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0"
              >
                Launch Command Center ?
              </button>
            </div>

            {/* Compliance Status & Exception Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Statutory Matrix</h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">All Rules Active</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">EPF Employee Share</span>
                    <span className="font-mono font-bold text-slate-900">12.00%</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">ESIC Employee Share</span>
                    <span className="font-mono font-bold text-slate-900">0.75%</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Professional Tax (PT)</span>
                    <span className="font-mono font-bold text-slate-900">?200 / mo</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Upcoming Regulatory Due Dates</h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Calendar</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">EPF ECR Return Filing</p>
                      <p className="text-[10px] text-slate-400">September 15, 2026</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">ESIC Monthly Contribution</p>
                      <p className="text-[10px] text-slate-400">September 15, 2026</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Exception Center</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${exceptions.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {exceptions.length} Flagged
                  </span>
                </div>
                {exceptions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                    <p className="text-xs font-bold text-emerald-800">Zero Blocking Exceptions</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">All enrolled employees have verified statutory IDs.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {exceptions.map((e) => (
                      <div key={e.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-amber-900">{e.name}</p>
                          <p className="text-[10px] text-amber-700">Missing statutory metadata</p>
                        </div>
                        <button onClick={() => setProfileModalData(e)} className="text-[10px] font-bold text-blue-600 underline">
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Employee 360 Directory */}
        {activeTab === "employees" && (
          <div className="p-8 space-y-6 max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employee 360 Directory</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Centrally manage company personnel, salary structures, PAN/UAN credentials, and disbursement bank accounts.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Enrol New Employee
              </button>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by Employee Code, Name, or Department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Department:</label>
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
            </div>

            {/* High-density Enterprise Employee Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Department & Role</th>
                      <th className="px-6 py-4">Statutory IDs (PAN/UAN)</th>
                      <th className="px-6 py-4">Disbursement Bank</th>
                      <th className="px-6 py-4 text-right">Monthly Gross</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                          No employees matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {emp.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-900">{emp.name}</p>
                                <p className="font-mono text-[10px] text-blue-600 font-semibold">{emp.employeeCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                              {emp.department}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{emp.designation}</p>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                            <div><span className="text-slate-400 font-medium">PAN:</span> {emp.pan}</div>
                            <div><span className="text-slate-400 font-medium">UAN:</span> {emp.uan}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                            <div>A/C: {emp.bankAccount}</div>
                            <div className="text-slate-400">{emp.ifsc}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                            ?{emp.monthlyGross?.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setProfileModalData(emp)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition"
                            >
                              View 360° Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Attendance & LOP Matrix */}
        {activeTab === "attendance" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance & Loss of Pay (LOP)</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure unpaid leave (LOP) days to automatically calculate proration factors for August 2026 (31 Calendar Days).
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Cycle Calendar Days</th>
                    <th className="px-6 py-4">Unpaid LOP Days</th>
                    <th className="px-6 py-4 text-right">Computed Payable Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const lop = Number(lopRecords[emp.id]) || 0;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{emp.employeeCode}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">31 Days</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={lopRecords[emp.id] || 0}
                            onChange={(e) => setLopRecords({ ...lopRecords, [emp.id]: e.target.value })}
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-black text-blue-600 text-sm">
                          {31 - lop} Days
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => { setActiveTab("payroll"); setPayrollStep(1); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Proceed to Payroll Command Center ?
              </button>
            </div>
          </div>
        )}

        {/* View 4: Payroll Command Center */}
        {activeTab === "payroll" && (
          <div className="p-8 space-y-6 max-w-7xl">
            {/* Guided Stepper Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs font-bold">
                <div className={`flex items-center gap-2 ${payrollStep >= 1 ? "text-blue-600" : "text-slate-400"}`}>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${payrollStep >= 1 ? "bg-blue-600 text-white" : "bg-slate-100"}`}>1</span>
                  Period Select
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${payrollStep >= 2 ? "text-blue-600" : "text-slate-400"}`}>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${payrollStep >= 2 ? "bg-blue-600 text-white" : "bg-slate-100"}`}>2</span>
                  LOP Validation
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${payrollStep >= 3 ? "text-blue-600" : "text-slate-400"}`}>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${payrollStep >= 3 ? "bg-blue-600 text-white" : "bg-slate-100"}`}>3</span>
                  Exception Check
                </div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className={`flex items-center gap-2 ${payrollStep >= 4 ? "text-blue-600" : "text-slate-400"}`}>
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black ${payrollStep >= 4 ? "bg-blue-600 text-white" : "bg-slate-100"}`}>4</span>
                  Settlement & Output
                </div>
              </div>
            </div>

            {payrollStep < 4 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xs text-center max-w-xl mx-auto space-y-6">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Execute August 2026 Payroll Cycle</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    The SARWIN engine will compute standard Indian statutory deductions (EPF 12%, ESIC 0.75%, Professional Tax, and TDS) across all {employees.length} enrolled employees.
                  </p>
                </div>

                <button
                  disabled={loading}
                  onClick={handleRunPayroll}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Computing Statutory Engine..." : "Execute Automated Payroll Run"}
                </button>
              </div>
            ) : (
              payrollData && (
                <div className="space-y-6">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Gross Payroll</p>
                      <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                        ?{payrollData.summary.totalGross.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Statutory (EPF + ESIC)</p>
                      <p className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                        ?{(payrollData.summary.totalEpf + payrollData.summary.totalEsic).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Tax Withholdings (TDS+PT)</p>
                      <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
                        ?{(payrollData.summary.totalTds + payrollData.summary.totalPt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Net Bank Disbursement</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                        ?{payrollData.summary.totalNetPayout.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Calculated Register */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                          August 2026 Finalized Payroll Register
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          All statutory deductions verified and finalized for banking disbursement.
                        </p>
                      </div>
                      <button
                        onClick={downloadNeftBatch}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download NEFT Bank Batch
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-3.5">Employee</th>
                            <th className="px-5 py-3.5 text-right">Gross</th>
                            <th className="px-5 py-3.5 text-right">EPF (12%)</th>
                            <th className="px-5 py-3.5 text-right">ESIC</th>
                            <th className="px-5 py-3.5 text-right">PT</th>
                            <th className="px-5 py-3.5 text-right">TDS</th>
                            <th className="px-5 py-3.5 text-right font-black text-slate-900">Net Salary</th>
                            <th className="px-5 py-3.5 text-center">Payslip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payrollData.calculations.map((c) => (
                            <tr key={c.employeeId} className="hover:bg-slate-50">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <p className="font-mono text-[10px] text-slate-400">{c.employeeCode}</p>
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono font-medium">
                                ?{c.earnings.gross.toLocaleString("en-IN")}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                                ?{c.deductions.epfEmployee}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                                ?{c.deductions.esicEmployee}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                                ?{c.deductions.pt}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                                ?{c.deductions.tds}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono font-black text-emerald-600 text-sm">
                                ?{c.netSalary.toLocaleString("en-IN")}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button
                                  onClick={() => setPayslipModalData(c)}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-200"
                                >
                                  View Payslip
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

        {/* View 5: Compliance Hub */}
        {activeTab === "compliance" && (
          <div className="p-8 space-y-6 max-w-6xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance & Statutory Hub</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Indian statutory health monitoring across EPF, ESIC, Professional Tax, and Income Tax withholding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm">Employees Provident Fund (EPF)</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Compliant</span>
                </div>
                <div className="text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between"><span>Statutory Rate (Employee):</span><strong>12.00%</strong></div>
                  <div className="flex justify-between"><span>Statutory Rate (Employer):</span><strong>12.00% (EPS 8.33% + EPF 3.67%)</strong></div>
                  <div className="flex justify-between"><span>Wage Ceiling:</span><strong>?15,000 / month</strong></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm">Employees' State Insurance (ESIC)</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Compliant</span>
                </div>
                <div className="text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between"><span>Employee Contribution:</span><strong>0.75% of Gross</strong></div>
                  <div className="flex justify-between"><span>Employer Contribution:</span><strong>3.25% of Gross</strong></div>
                  <div className="flex justify-between"><span>Wage Ceiling Threshold:</span><strong>?21,000 / month</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 6: Disbursement Reports */}
        {activeTab === "reports" && (
          <div className="p-8 space-y-6 max-w-5xl">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Disbursement & Compliance Reports</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Export verified banking files and statutory returns for August 2026.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-sm">NEFT / RTGS Corporate Salary Batch File</h4>
                <p className="text-xs text-slate-500 mt-0.5">Compatible with HDFC, ICICI, SBI, and Axis Bank bulk disbursement portals.</p>
              </div>
              <button
                onClick={downloadNeftBatch}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Export CSV Batch
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Enrol New Employee */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Enrol Employee in SARWIN HRPAYROLL</h3>
                <p className="text-[11px] text-slate-500">Auto-splits Basic (50%), HRA (40%), and Special Allowances.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">?</button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Varma"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="aditi@sarwinhr.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option>Engineering</option>
                    <option>Product & Design</option>
                    <option>Operations</option>
                    <option>Human Resources</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input
                    type="text"
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Gross (?)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.monthlyGross}
                    onChange={(e) => setNewEmp({ ...newEmp, monthlyGross: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={newEmp.pan}
                    onChange={(e) => setNewEmp({ ...newEmp, pan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UAN Number</label>
                  <input
                    type="text"
                    value={newEmp.uan}
                    onChange={(e) => setNewEmp({ ...newEmp, uan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Account</label>
                  <input
                    type="text"
                    value={newEmp.bankAccount}
                    onChange={(e) => setNewEmp({ ...newEmp, bankAccount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={newEmp.ifsc}
                    onChange={(e) => setNewEmp({ ...newEmp, ifsc: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono outline-none uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Confirm & Enrol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Employee 360° Profile Workspace */}
      {profileModalData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                  {profileModalData.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{profileModalData.name}</h3>
                  <p className="font-mono text-xs text-blue-600 font-bold">{profileModalData.employeeCode} · {profileModalData.designation}</p>
                </div>
              </div>
              <button onClick={() => setProfileModalData(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">?</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-blue-700">Employment & Identity</h4>
                <p><span className="text-slate-400 font-medium">Department:</span> <strong>{profileModalData.department}</strong></p>
                <p><span className="text-slate-400 font-medium">Email:</span> {profileModalData.email}</p>
                <p><span className="text-slate-400 font-medium">PAN Number:</span> {profileModalData.pan}</p>
                <p><span className="text-slate-400 font-medium">UAN Number:</span> {profileModalData.uan}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-emerald-700">Salary & Banking</h4>
                <p><span className="text-slate-400 font-medium">Monthly Gross:</span> <strong className="font-mono text-slate-900">?{profileModalData.monthlyGross?.toLocaleString("en-IN")}</strong></p>
                <p><span className="text-slate-400 font-medium">Basic Pay (50%):</span> <span className="font-mono">?{profileModalData.basicSalary?.toLocaleString("en-IN")}</span></p>
                <p><span className="text-slate-400 font-medium">Bank A/C:</span> <span className="font-mono">{profileModalData.bankAccount}</span></p>
                <p><span className="text-slate-400 font-medium">IFSC:</span> <span className="font-mono">{profileModalData.ifsc}</span></p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setProfileModalData(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close 360° Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: SARWIN HRPAYROLL Corporate Payslip Generator */}
      {payslipModalData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border border-slate-200" id="sarwin-printable-payslip">
            {/* Corporate Payslip Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  S
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">SARWIN HRPAYROLL</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Enterprise HR & Payroll Platform</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  FINALIZED / PAID
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">Period: August 2026</p>
              </div>
            </div>

            {/* Employee Metadata Strip */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p><span className="text-slate-400 font-medium">Employee Name:</span> <strong>{payslipModalData.name}</strong></p>
                <p><span className="text-slate-400 font-medium">Employee Code:</span> {payslipModalData.employeeCode}</p>
                <p><span className="text-slate-400 font-medium">Department:</span> {payslipModalData.department}</p>
                <p><span className="text-slate-400 font-medium">Designation:</span> {payslipModalData.designation}</p>
              </div>
              <div>
                <p><span className="text-slate-400 font-medium">PAN:</span> {payslipModalData.pan}</p>
                <p><span className="text-slate-400 font-medium">UAN:</span> {payslipModalData.uan}</p>
                <p><span className="text-slate-400 font-medium">Bank A/C:</span> {payslipModalData.bankAccount}</p>
                <p><span className="text-slate-400 font-medium">Payable Days:</span> {payslipModalData.payableDays} / 31 Days</p>
              </div>
            </div>

            {/* Earnings vs Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-5 text-xs">
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2 text-[11px] uppercase tracking-wider text-blue-700">Earnings</h4>
                <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">?{payslipModalData.earnings.basic.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>House Rent Allowance (HRA)</span><span className="font-mono">?{payslipModalData.earnings.hra.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Special Allowance</span><span className="font-mono">?{payslipModalData.earnings.special.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between font-black border-t pt-2 mt-2 text-slate-900">
                  <span>Gross Pay</span>
                  <span className="font-mono">?{payslipModalData.earnings.gross.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 border-b pb-2 text-[11px] uppercase tracking-wider text-amber-700">Deductions</h4>
                <div className="flex justify-between"><span>Provident Fund (EPF 12%)</span><span className="font-mono">?{payslipModalData.deductions.epfEmployee.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>ESIC</span><span className="font-mono">?{payslipModalData.deductions.esicEmployee.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="font-mono">?{payslipModalData.deductions.pt.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Tax Withheld (TDS)</span><span className="font-mono">?{payslipModalData.deductions.tds.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between font-black border-t pt-2 mt-2 text-slate-900">
                  <span>Total Deductions</span>
                  <span className="font-mono">?{payslipModalData.deductions.totalDeductions.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Bank Payout</p>
                <p className="text-2xl font-black font-mono text-emerald-400">
                  ?{payslipModalData.netSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  Print Official Slip
                </button>
                <button
                  onClick={() => setPayslipModalData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
