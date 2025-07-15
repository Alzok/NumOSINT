const { PrismaClient } = require('@prisma/client');

// Ajout pour éviter les instanciations multiples en développement avec le hot-reloading
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;