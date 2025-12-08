// Seed a single admin account.
// Usage: npm run seed:admin -- --email you@example.com --name "Your Name" --password "StrongPass" [--role SUPERADMIN|EXAMINER|VIEWER]
const bcrypt = require('bcryptjs');
const { PrismaClient, AdminRole } = require('@prisma/client');

const prisma = new PrismaClient();

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const emailRaw = arg('--email');
  const name = arg('--name');
  const password = arg('--password');
  const roleRaw = (arg('--role') || 'SUPERADMIN').toUpperCase();

  if (!emailRaw || !name || !password) {
    console.error('Usage: npm run seed:admin -- --email you@example.com --name "Your Name" --password "StrongPass" [--role SUPERADMIN|EXAMINER|VIEWER]');
    process.exit(1);
  }

  const email = emailRaw.trim().toLowerCase();
  if (!Object.keys(AdminRole).includes(roleRaw)) {
    console.error(`Invalid role "${roleRaw}". Valid roles: ${Object.keys(AdminRole).join(', ')}`);
    process.exit(1);
  }
  const role = AdminRole[roleRaw];

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, name, passwordHash, role },
    update: { name, passwordHash, role, revokedAt: null, active: true },
  });

  console.log(`Seeded admin ${admin.email} (${admin.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
