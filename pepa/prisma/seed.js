const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Delete existing user if any
  await prisma.user.deleteMany({
    where: { email: 'profesorColoma@gmail.com' }
  });

  const hashed = await bcrypt.hash('12345', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'profesorColoma',
      email: 'profesorColoma@gmail.com',
      password: hashed,
      role: 'admin'
    }
  });

  console.log('✓ User created:', user);
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

