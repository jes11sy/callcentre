const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmailSettings() {
  try {
    const settings = await prisma.emailSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📧 Настройки почты в БД:');
    console.log(JSON.stringify(settings, null, 2));
    
    if (settings) {
      console.log(`\n✅ Найдены настройки:`);
      console.log(`- Host: ${settings.host}`);
      console.log(`- User: ${settings.user}`);
      console.log(`- Mango Email: ${settings.mangoEmail}`);
      console.log(`- Enabled: ${settings.enabled}`);
      console.log(`- Check Interval: ${settings.checkInterval} минут`);
    } else {
      console.log('❌ Настройки не найдены');
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailSettings();
