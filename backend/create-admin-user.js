const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Создание пользователя администратора...');
    
    // Получаем данные от пользователя
    const login = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const note = process.argv[4] || 'Администратор создан через скрипт';

    // Проверяем, существует ли уже пользователь с таким логином
    const existingAdmin = await prisma.callcentreAdmin.findUnique({
      where: { login }
    });

    if (existingAdmin) {
      console.log(`❌ Пользователь с логином "${login}" уже существует!`);
      console.log(`ID: ${existingAdmin.id}, Создан: ${existingAdmin.createdAt}`);
      return;
    }

    // Хешируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем администратора
    const admin = await prisma.callcentreAdmin.create({
      data: {
        login,
        password: hashedPassword,
        note
      }
    });

    console.log('✅ Администратор успешно создан!');
    console.log(`ID: ${admin.id}`);
    console.log(`Логин: ${admin.login}`);
    console.log(`Заметка: ${admin.note}`);
    console.log(`Создан: ${admin.createdAt}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Показываем справку если нет аргументов
if (process.argv.length === 2) {
  console.log('📋 Использование:');
  console.log('node create-admin-user.js [логин] [пароль] [заметка]');
  console.log('');
  console.log('Примеры:');
  console.log('node create-admin-user.js admin password123 "Главный администратор"');
  console.log('node create-admin-user.js manager manager456 "Менеджер"');
  console.log('');
  console.log('Если не указать параметры, будут использованы значения по умолчанию:');
  console.log('Логин: admin, Пароль: admin123, Заметка: "Администратор создан через скрипт"');
  console.log('');
}

createAdmin();
