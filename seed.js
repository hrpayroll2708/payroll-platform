const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo database records...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      slug: 'acme-corp',
      name: 'Acme Technologies Pvt Ltd',
      status: 'ACTIVE'
    }
  });

  // 2. Create Company
  let company = await prisma.company.findFirst({
    where: { tenant_id: tenant.id }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        tenant_id: tenant.id,
        legal_name: 'Acme Technologies Private Limited',
        pan_hash: 'ABCDE1234F',
        tan: 'BLRA12345C'
      }
    });
  }

  // 3. Create Sample Employee
  await prisma.employee.upsert({
    where: {
      company_id_employee_code: {
        company_id: company.id,
        employee_code: 'EMP001'
      }
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      company_id: company.id,
      employee_code: 'EMP001',
      first_name: 'Rahul',
      last_name: 'Sharma',
      gender: 'MALE',
      date_of_joining: new Date('2024-01-15'),
      status: 'ACTIVE',
      pan_hash: 'AAAAA0000A'
    }
  });

  console.log('Database successfully seeded with demo tenant, company, and employee.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
