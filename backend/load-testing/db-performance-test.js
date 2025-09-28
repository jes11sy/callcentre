const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

class DatabasePerformanceTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = {
      queries: [],
      summary: {
        totalQueries: 0,
        averageTime: 0,
        slowestQuery: null,
        fastestQuery: null
      }
    };
  }

  // Тестовые запросы
  getTestQueries() {
    return [
      {
        name: 'Подсчет всех звонков',
        query: () => this.prisma.call.count()
      },
      {
        name: 'Подсчет звонков по оператору',
        query: () => this.prisma.call.count({
          where: { operatorId: 1 }
        })
      },
      {
        name: 'Получение звонков с пагинацией',
        query: () => this.prisma.call.findMany({
          take: 20,
          skip: 0,
          orderBy: { dateCreate: 'desc' },
          include: {
            operator: {
              select: { id: true, name: true }
            }
          }
        })
      },
      {
        name: 'Поиск звонков по городу',
        query: () => this.prisma.call.findMany({
          where: {
            city: {
              contains: 'Москва',
              mode: 'insensitive'
            }
          },
          take: 10
        })
      },
      {
        name: 'Группировка звонков по статусу',
        query: () => this.prisma.call.groupBy({
          by: ['status'],
          _count: { id: true }
        })
      },
      {
        name: 'Статистика оператора',
        query: () => this.prisma.call.groupBy({
          by: ['operatorId', 'status'],
          where: {
            dateCreate: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31')
            }
          },
          _count: { id: true }
        })
      },
      {
        name: 'Подсчет всех заказов',
        query: () => this.prisma.order.count()
      },
      {
        name: 'Получение заказов с оператором',
        query: () => this.prisma.order.findMany({
          take: 20,
          include: {
            operator: {
              select: { id: true, name: true }
            }
          }
        })
      },
      {
        name: 'Поиск заказов по телефону',
        query: () => this.prisma.order.findMany({
          where: {
            phone: {
              contains: '8'
            }
          },
          take: 10
        })
      },
      {
        name: 'Группировка заказов по статусу',
        query: () => this.prisma.order.groupBy({
          by: ['statusOrder'],
          _count: { id: true }
        })
      }
    ];
  }

  // Выполнение одного запроса
  async executeQuery(testQuery, iterations = 5) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        await testQuery.query();
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        times.push(executionTime);
      } catch (error) {
        console.error(`❌ Ошибка в запросе "${testQuery.name}":`, error.message);
        return {
          name: testQuery.name,
          success: false,
          error: error.message,
          averageTime: 0,
          minTime: 0,
          maxTime: 0
        };
      }
    }
    
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      name: testQuery.name,
      success: true,
      averageTime: Math.round(averageTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      iterations
    };
  }

  // Тестирование индексов
  async testIndexes() {
    console.log('\n🔍 Тестирование индексов...');
    
    const indexTests = [
      {
        name: 'Поиск по operatorId (с индексом)',
        query: () => this.prisma.call.findMany({
          where: { operatorId: 1 },
          take: 100
        })
      },
      {
        name: 'Поиск по dateCreate (с индексом)',
        query: () => this.prisma.call.findMany({
          where: {
            dateCreate: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31')
            }
          },
          take: 100
        })
      },
      {
        name: 'Поиск по city (с индексом)',
        query: () => this.prisma.call.findMany({
          where: {
            city: {
              contains: 'Москва',
              mode: 'insensitive'
            }
          },
          take: 100
        })
      },
      {
        name: 'Поиск по status (с индексом)',
        query: () => this.prisma.call.findMany({
          where: { status: 'answered' },
          take: 100
        })
      }
    ];
    
    const indexResults = [];
    for (const test of indexTests) {
      const result = await this.executeQuery(test, 3);
      indexResults.push(result);
      console.log(`   ${result.name}: ${result.averageTime}мс (мин: ${result.minTime}мс, макс: ${result.maxTime}мс)`);
    }
    
    return indexResults;
  }

  // Тестирование сложных запросов
  async testComplexQueries() {
    console.log('\n🧮 Тестирование сложных запросов...');
    
    const complexQueries = [
      {
        name: 'Статистика по операторам за период',
        query: () => this.prisma.call.groupBy({
          by: ['operatorId'],
          where: {
            dateCreate: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31')
            }
          },
          _count: { id: true },
          _avg: { id: true }
        })
      },
      {
        name: 'Топ-5 операторов по звонкам',
        query: () => this.prisma.call.groupBy({
          by: ['operatorId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      },
      {
        name: 'Статистика по городам',
        query: () => this.prisma.call.groupBy({
          by: ['city'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        })
      },
      {
        name: 'Среднее количество звонков в день',
        query: () => this.prisma.call.groupBy({
          by: ['dateCreate'],
          _count: { id: true },
          orderBy: { dateCreate: 'desc' },
          take: 30
        })
      }
    ];
    
    const complexResults = [];
    for (const query of complexQueries) {
      const result = await this.executeQuery(query, 3);
      complexResults.push(result);
      console.log(`   ${result.name}: ${result.averageTime}мс`);
    }
    
    return complexResults;
  }

  // Тестирование производительности вставки
  async testInsertPerformance() {
    console.log('\n📝 Тестирование производительности вставки...');
    
    const insertTests = [];
    
    // Тест вставки одного звонка
    const singleInsertStart = performance.now();
    try {
      await this.prisma.call.create({
        data: {
          rk: 'TEST_RK',
          city: 'Тестовый город',
          phoneClient: '+79999999999',
          phoneAts: '+79999999998',
          dateCreate: new Date(),
          operatorId: 1,
          status: 'test'
        }
      });
      const singleInsertEnd = performance.now();
      insertTests.push({
        name: 'Вставка одного звонка',
        time: Math.round((singleInsertEnd - singleInsertStart) * 100) / 100
      });
    } catch (error) {
      console.log(`   Вставка одного звонка: ошибка - ${error.message}`);
    }
    
    // Тест вставки одного заказа
    const singleOrderStart = performance.now();
    try {
      await this.prisma.order.create({
        data: {
          rk: 'TEST_RK',
          city: 'Тестовый город',
          phone: '+79999999999',
          typeOrder: 'first_time',
          clientName: 'Тестовый клиент',
          address: 'Тестовый адрес',
          dateMeeting: new Date(),
          typeEquipment: 'kp',
          problem: 'Тестовая проблема',
          statusOrder: 'new',
          operatorNameId: 1,
          createDate: new Date()
        }
      });
      const singleOrderEnd = performance.now();
      insertTests.push({
        name: 'Вставка одного заказа',
        time: Math.round((singleOrderEnd - singleOrderStart) * 100) / 100
      });
    } catch (error) {
      console.log(`   Вставка одного заказа: ошибка - ${error.message}`);
    }
    
    insertTests.forEach(test => {
      console.log(`   ${test.name}: ${test.time}мс`);
    });
    
    return insertTests;
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log('🗄️  Начало тестирования производительности базы данных...\n');
    
    try {
      // Основные запросы
      console.log('📊 Тестирование основных запросов...');
      const queries = this.getTestQueries();
      
      for (const query of queries) {
        const result = await this.executeQuery(query, 3);
        this.results.queries.push(result);
        
        if (result.success) {
          console.log(`   ✅ ${result.name}: ${result.averageTime}мс (мин: ${result.minTime}мс, макс: ${result.maxTime}мс)`);
        } else {
          console.log(`   ❌ ${result.name}: ошибка - ${result.error}`);
        }
      }
      
      // Тестирование индексов
      const indexResults = await this.testIndexes();
      
      // Тестирование сложных запросов
      const complexResults = await this.testComplexQueries();
      
      // Тестирование вставки
      const insertResults = await this.testInsertPerformance();
      
      // Генерация отчета
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Ошибка при тестировании:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  // Генерация отчета
  generateReport() {
    console.log('\n📋 ОТЧЕТ О ПРОИЗВОДИТЕЛЬНОСТИ БАЗЫ ДАННЫХ');
    console.log('='.repeat(60));
    
    const successfulQueries = this.results.queries.filter(q => q.success);
    
    if (successfulQueries.length === 0) {
      console.log('❌ Нет успешных запросов для анализа');
      return;
    }
    
    const averageTime = successfulQueries.reduce((sum, q) => sum + q.averageTime, 0) / successfulQueries.length;
    const slowestQuery = successfulQueries.reduce((slowest, q) => 
      q.averageTime > slowest.averageTime ? q : slowest
    );
    const fastestQuery = successfulQueries.reduce((fastest, q) => 
      q.averageTime < fastest.averageTime ? q : fastest
    );
    
    console.log(`\n📊 Общая статистика:`);
    console.log(`   Всего запросов: ${this.results.queries.length}`);
    console.log(`   Успешных: ${successfulQueries.length}`);
    console.log(`   Неудачных: ${this.results.queries.length - successfulQueries.length}`);
    console.log(`   Среднее время выполнения: ${Math.round(averageTime * 100) / 100}мс`);
    console.log(`   Самый медленный запрос: ${slowestQuery.name} (${slowestQuery.averageTime}мс)`);
    console.log(`   Самый быстрый запрос: ${fastestQuery.name} (${fastestQuery.averageTime}мс)`);
    
    console.log(`\n📈 Топ-5 самых медленных запросов:`);
    const slowestQueries = successfulQueries
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
    
    slowestQueries.forEach((query, index) => {
      console.log(`   ${index + 1}. ${query.name}: ${query.averageTime}мс`);
    });
    
    console.log(`\n💡 Рекомендации:`);
    
    if (averageTime > 100) {
      console.log(`   ⚠️  Высокое среднее время выполнения (${Math.round(averageTime)}мс)`);
      console.log(`   Рекомендуется проверить индексы и оптимизировать запросы`);
    }
    
    if (slowestQuery.averageTime > 1000) {
      console.log(`   ⚠️  Очень медленный запрос: ${slowestQuery.name} (${slowestQuery.averageTime}мс)`);
      console.log(`   Требуется срочная оптимизация`);
    }
    
    const slowQueries = successfulQueries.filter(q => q.averageTime > 500);
    if (slowQueries.length > 0) {
      console.log(`   ⚠️  ${slowQueries.length} запросов выполняются медленнее 500мс`);
      console.log(`   Рекомендуется добавить индексы или переписать запросы`);
    }
    
    console.log(`\n✅ Тестирование производительности базы данных завершено!`);
  }
}

// Запуск тестирования
async function main() {
  const tester = new DatabasePerformanceTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabasePerformanceTester;
