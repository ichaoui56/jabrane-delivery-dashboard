const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function saltAndHashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('كلمة المرور غير صالحة');
  }

  if (password.length < 8) {
    throw new Error('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
  }

  const saltRounds = 12;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@noorstyle.com' }
  });

  if (existingUser) {
    console.log('✅ User already exists:', existingUser.email);
    return;
  }

  // Create admin user
  const hashedPassword = saltAndHashPassword('Noorstyle@222');
  
  const user = await prisma.user.create({
    data: {
      name: 'مدير النظام',
      email: 'admin@noorstyle.com',
      password: hashedPassword,
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });