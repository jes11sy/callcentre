const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const login = 'jessy';
    const password = 'Fuck2015@';
    const note = 'Администратор';

    // Проверяем существование
    const existing = await prisma.callcentreAdmin.findUnique({
      where: { login }
    });

    if (existing) {
      console.log('Админ уже существует!');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем админа
    const admin = await prisma.callcentreAdmin.create({
      data: {
        login,
        password: hashedPassword,
        note
      }
    });

    console.log('✅ Админ создан!');
    console.log(`ID: ${admin.id}`);
    console.log(`Логин: ${login}`);
    console.log(`Пароль: ${password}`);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
