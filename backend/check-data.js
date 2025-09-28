const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Проверяем данные в базе...\n');

    // Проверяем операторов
    const operators = await prisma.callcentreOperator.findMany();
    console.log(`👥 Операторы: ${operators.length}`);
    if (operators.length > 0) {
      console.log('   Первый оператор:', operators[0].name, '(ID:', operators[0].id + ')');
    }

    // Проверяем звонки
    const calls = await prisma.call.findMany();
    console.log(`📞 Звонки: ${calls.length}`);
    if (calls.length > 0) {
      console.log('   Последний звонок:', calls[calls.length - 1].dateCreate);
    }

    // Проверяем заказы
    const orders = await prisma.order.findMany();
    console.log(`📋 Заказы: ${orders.length}`);
    if (orders.length > 0) {
      console.log('   Последний заказ:', orders[orders.length - 1].createDate);
    }

    // Проверяем телефоны
    const phones = await prisma.phone.findMany();
    console.log(`📱 Телефоны: ${phones.length}`);

    // Проверяем аккаунты Авито
    const avitoAccounts = await prisma.avito.findMany();
    console.log(`🏪 Аккаунты Авито: ${avitoAccounts.length}`);

    console.log('\n✅ Проверка завершена');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
