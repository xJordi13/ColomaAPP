const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'profesorColoma@gmail.com' },
    select: { email: true, password: true },
  });

  console.log('user exists:', Boolean(user));
  if (!user) return;

  const ok = await bcrypt.compare('12345', user.password);
  console.log('password matches:', ok);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
