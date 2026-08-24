const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', platform: 'Kredily-Style HRMS API' });
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const monthlyGrossPayroll = employees.reduce((sum, emp) => sum + (emp.monthlyGross || 0), 0);
    const statutoryLiability = Math.round(monthlyGrossPayroll * 0.15);

    res.json({
      totalEmployees,
      monthlyGrossPayroll,
      statutoryLiability,
      processedPeriod: "August 2026",
      complianceStatus: "100% Compliant"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { employeeCode, name, email, department, designation, pan, uan, bankAccount, ifsc, monthlyGross } = req.body;
    const gross = Number(monthlyGross) || 30000;
    const basic = Math.round(gross * 0.50);
    const hra = Math.round(basic * 0.40);
    const specialAllowance = Math.max(0, gross - (basic + hra));

    const employee = await prisma.employee.create({
      data: {
        employeeCode: employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        email,
        department: department || 'General',
        designation: designation || 'Associate',
        pan: pan || 'ABCDE1234F',
        uan: uan || '100998877665',
        bankAccount: bankAccount || '98765432101',
        ifsc: ifsc || 'HDFC0001234',
        monthlyGross: gross,
        basicSalary: basic,
        hra,
        specialAllowance,
        status: 'ACTIVE'
      }
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payroll/calculate', async (req, res) => {
  try {
    const { month = 8, year = 2026, lopRecords = {} } = req.body;
    const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const daysInMonth = 31;

    const calculations = employees.map(emp => {
      const lopDays = Number(lopRecords[emp.id]) || 0;
      const payableDays = Math.max(0, daysInMonth - lopDays);
      const prorationFactor = payableDays / daysInMonth;

      const gross = Math.round((emp.monthlyGross || 0) * prorationFactor);
      const basic = Math.round((emp.basicSalary || gross * 0.5) * prorationFactor);
      const hra = Math.round((emp.hra || basic * 0.4) * prorationFactor);
      const special = Math.max(0, gross - (basic + hra));

      const epfEmployee = basic <= 15000 ? Math.round(basic * 0.12) : 1800;
      const epfEmployer = epfEmployee;
      const esicEmployee = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const esicEmployer = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
      const pt = gross > 15000 ? 200 : 0;
      const tds = gross > 75000 ? Math.round(gross * 0.10) : (gross > 50000 ? Math.round(gross * 0.05) : 0);

      const totalDeductions = epfEmployee + esicEmployee + pt + tds;
      const netSalary = Math.max(0, gross - totalDeductions);

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        bankAccount: emp.bankAccount,
        ifsc: emp.ifsc,
        pan: emp.pan,
        uan: emp.uan,
        payableDays,
        lopDays,
        earnings: { basic, hra, special, gross },
        deductions: { epfEmployee, esicEmployee, pt, tds, totalDeductions },
        employerContributions: { epfEmployer, esicEmployer },
        netSalary
      };
    });

    const summary = {
      totalEmployees: calculations.length,
      totalGross: calculations.reduce((acc, c) => acc + c.earnings.gross, 0),
      totalEpf: calculations.reduce((acc, c) => acc + c.deductions.epfEmployee + c.employerContributions.epfEmployer, 0),
      totalEsic: calculations.reduce((acc, c) => acc + c.deductions.esicEmployee + c.employerContributions.esicEmployer, 0),
      totalPt: calculations.reduce((acc, c) => acc + c.deductions.pt, 0),
      totalTds: calculations.reduce((acc, c) => acc + c.deductions.tds, 0),
      totalNetPayout: calculations.reduce((acc, c) => acc + c.netSalary, 0),
      period: `August ${year}`
    };

    res.json({ summary, calculations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`?? API running on port ${PORT}`));
