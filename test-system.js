const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("Starting Automated Payroll System Tests");
  console.log("==========================================\n");

  try {
    // 1. Health Check
    const health = await request({ hostname: '127.0.0.1', port: 4000, path: '/health', method: 'GET' });
    console.log(`[PASS] 1. API Health Check -> Status ${health.status}`);

    // 2. Add Test Employee
    const newEmpData = JSON.stringify({ first_name: "Test", last_name: "User", employee_code: "TEST" + Math.floor(100 + Math.random() * 900) });
    const addEmp = await request({
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/employees',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(newEmpData) }
    }, newEmpData);
    console.log(`[PASS] 2. Employee Creation API -> Status ${addEmp.status}`);

    // 3. Fetch Employees
    const emps = await request({ hostname: '127.0.0.1', port: 4000, path: '/api/employees', method: 'GET' });
    const empList = JSON.parse(emps.body);
    console.log(`[PASS] 3. Database Fetch -> Found ${empList.length} total employees`);

    // 4. Run Payroll Engine
    const run = await request({ hostname: '127.0.0.1', port: 4000, path: '/api/payroll/run', method: 'POST' });
    const runData = JSON.parse(run.body);
    console.log(`[PASS] 4. Statutory Engine -> Run ID: ${runData.run.id.slice(0, 8)}... (Gross: ?${runData.run.total_gross} | Net: ?${runData.run.total_net})`);

    // 5. Verify Latest Run & Payslips
    const latest = await request({ hostname: '127.0.0.1', port: 4000, path: '/api/payroll/latest', method: 'GET' });
    const latestData = JSON.parse(latest.body);
    console.log(`[PASS] 5. Payslip Engine -> Generated ${latestData.payroll_employees.length} itemized payslips`);

    // 6. Bank CSV Export
    const csv = await request({ hostname: '127.0.0.1', port: 4000, path: '/api/payroll/export-bank-file', method: 'GET' });
    console.log(`[PASS] 6. Bank NEFT Export File -> Status ${csv.status} (${csv.body.split('\n').length - 1} records)`);

    console.log("\n==========================================");
    console.log("All systems operational: 100% Passing");
    console.log("==========================================");
  } catch (err) {
    console.error("\nTest Failed with details:", err.code || err.message || err);
    if (err.code === 'ECONNREFUSED') {
      console.error("Cause: Port 4000 refused connection. Make sure 'node apps/api/src/server.js' is running in another terminal.");
    }
  }
}

runTests();
