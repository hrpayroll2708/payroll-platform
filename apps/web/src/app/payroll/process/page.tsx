'use client';
import React, { useEffect, useState } from 'react';

export default function PayrollProcessPage() {
  const [employees, setEmployees] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [runDetails, setRunDetails] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // New Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [empCode, setEmpCode] = useState('');

  const fetchInitialData = async () => {
    try {
      const [empRes, runRes] = await Promise.all([
        fetch('https://payroll-platform-i9rn.onrender.com/api/employees'),
        fetch('https://payroll-platform-i9rn.onrender.com/api/payroll/latest')
      ]);
      const empData = await empRes.json();
      const runData = await runRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      if (runData && runData.id) {
        setRunDetails(runData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !empCode) return;

    try {
      const res = await fetch('https://payroll-platform-i9rn.onrender.com/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, employee_code: empCode })
      });
      if (res.ok) {
        setFirstName('');
        setLastName('');
        setEmpCode('');
        setShowAddModal(false);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunPayroll = async () => {
    setProcessing(true);
    setStatusMsg('Executing statutory calculations...');
    try {
      const res = await fetch('https://payroll-platform-i9rn.onrender.com/api/payroll/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error occurred');

      setIsSuccess(true);
      setRunDetails(data.run);
      setStatusMsg(`Success: Payroll batch processed for ${data.run.payroll_month}/${data.run.payroll_year}`);
    } catch (err) {
      setIsSuccess(false);
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const downloadBankFile = () => {
    window.open('https://payroll-platform-i9rn.onrender.com/api/payroll/export-bank-file', '_blank');
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '2.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#131b2e', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>Payroll Execution Dashboard</h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Connected to PostgreSQL via API (Port 4000)</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Employee
          </button>
        </div>

        {/* Employee List */}
        <div style={{ padding: '1.25rem', background: '#1e293b', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem 0', color: '#f1f5f9' }}>Employees in Current Cycle ({employees.length})</h2>
          {loading ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>Loading records from database...</p>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #334155' }}>
                <span><strong>{emp.employee_code}</strong>: {emp.first_name} {emp.last_name}</span>
                <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.9rem' }}>Active</span>
              </div>
            ))
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleRunPayroll}
            disabled={processing || loading}
            style={{
              backgroundColor: processing ? '#475569' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : 'Run Payroll Batch'}
          </button>

          {runDetails && (
            <button
              onClick={downloadBankFile}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ?? Export Bank Payout CSV
            </button>
          )}
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1rem',
            background: isSuccess ? '#064e3b' : '#7f1d1d',
            color: isSuccess ? '#6ee7b7' : '#fca5a5',
            borderRadius: '6px'
          }}>
            {statusMsg}
          </div>
        )}

        {/* Payroll Summary Breakdown */}
        {runDetails && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#38bdf8' }}>Cycle Summary Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Gross</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>?{runDetails.total_gross}</div>
              </div>
              <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Deductions</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>-?{runDetails.total_deductions}</div>
              </div>
              <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Net Pay</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>?{runDetails.total_net}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9' }}>Generated Employee Payslips</h4>
            {runDetails.payroll_employees?.map((pe) => (
              <div key={pe.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <div>
                  <strong>{pe.employee?.first_name} {pe.employee?.last_name}</strong> ({pe.employee?.employee_code})
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Net: ?{pe.net_pay} | Days: {pe.paid_days}</div>
                </div>
                <button
                  onClick={() => setSelectedPayslip(pe)}
                  style={{ background: '#38bdf8', color: '#090d16', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                >
                  View Payslip
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Employee */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleAddEmployee} style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Add New Employee</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#94a3b8' }}>Employee Code</label>
                <input required value={empCode} onChange={(e) => setEmpCode(e.target.value)} placeholder="e.g. EMP002" style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#94a3b8' }}>First Name</label>
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Priya" style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#94a3b8' }}>Last Name</label>
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Patel" style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#475569', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Payslip */}
        {selectedPayslip && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '8px', maxWidth: '600px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Acme Technologies Pvt Ltd</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Payslip for Month: {runDetails.payroll_month}/{runDetails.payroll_year}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{selectedPayslip.employee?.first_name} {selectedPayslip.employee?.last_name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedPayslip.employee?.employee_code}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>Earnings</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>Basic:</span> <strong>?42,500.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>HRA:</span> <strong>?21,250.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>Special Allowance:</span> <strong>?21,250.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem' }}><strong>Gross Earnings:</strong> <strong>?{selectedPayslip.earned_gross}</strong></div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c' }}>Deductions</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>EPF (PF):</span> <strong>?1,800.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>PT:</span> <strong>?200.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}><span>TDS:</span> <strong>?5,200.00</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem' }}><strong>Total Deductions:</strong> <strong>?{selectedPayslip.total_deductions}</strong></div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Net Take-Home Pay:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669' }}>?{selectedPayslip.net_pay}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => window.print()} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Print / Save PDF</button>
                <button onClick={() => setSelectedPayslip(null)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
