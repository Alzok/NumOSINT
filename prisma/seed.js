const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du script de seeding...');

  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Les variables d\'environnement SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD sont requises.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: email },
    update: {
      role: 'ADMIN',
      credits: 999,
    },
    create: {
      email: email,
      password: hashedPassword,
      role: 'ADMIN',
      credits: 999,
      name: 'Super Admin',
    },
  });

  console.log(`✅ Utilisateur admin créé/mis à jour : ${admin.email}`);
  console.log('🌱 Fin du script de seeding.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });