const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.user.count();
    console.log('count', count);
  } catch (error) {
    console.error('PRISMA_ERROR:', error && error.message ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
