const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDates() {
  try {
    // Проверяем диапазон дат в таблице calls
    const callsDateRange = await prisma.call.findMany({
      select: { dateCreate: true },
      orderBy: { dateCreate: 'asc' },
      take: 1
    });
    
    const callsDateRangeEnd = await prisma.call.findMany({
      select: { dateCreate: true },
      orderBy: { dateCreate: 'desc' },
      take: 1
    });
    
    console.log('Диапазон дат в calls:');
    console.log('Начало:', callsDateRange[0]?.dateCreate);
    console.log('Конец:', callsDateRangeEnd[0]?.dateCreate);
    
    // Проверяем диапазон дат в таблице orders
    const ordersDateRange = await prisma.order.findMany({
      select: { createDate: true },
      orderBy: { createDate: 'asc' },
      take: 1
    });
    
    const ordersDateRangeEnd = await prisma.order.findMany({
      select: { createDate: true },
      orderBy: { createDate: 'desc' },
      take: 1
    });
    
    console.log('\nДиапазон дат в orders:');
    console.log('Начало:', ordersDateRange[0]?.createDate);
    console.log('Конец:', ordersDateRangeEnd[0]?.createDate);
    
    // Проверяем звонки оператора Артур (ID: 1)
    const arthurCalls = await prisma.call.findMany({
      where: { operatorId: 1 },
      select: { dateCreate: true, status: true },
      orderBy: { dateCreate: 'desc' },
      take: 5
    });
    
    console.log('\nПоследние 5 звонков оператора Артур:');
    arthurCalls.forEach(call => {
      console.log(`${call.dateCreate} - ${call.status}`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();
