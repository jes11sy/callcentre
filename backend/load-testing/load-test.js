const axios = require('axios');
const { performance } = require('perf_hooks');

// Конфигурация тестирования
const CONFIG = {
  baseURL: 'http://localhost:5000/api',
  auth: {
    login: 'admin',
    password: 'admin123'
  },
  testScenarios: {
    // Количество одновременных пользователей
    concurrentUsers: [1, 5, 10, 20, 50],
    // Длительность теста в секундах
    duration: 30,
    // Задержка между запросами (мс)
    requestDelay: 100
  }
};

class LoadTester {
  constructor() {
    this.results = {
      scenarios: [],
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        requestsPerSecond: 0
      }
    };
    this.authToken = null;
  }

  // Аутентификация
  async authenticate() {
    try {
      const response = await axios.post(`${CONFIG.baseURL}/auth/login`, {
        login: CONFIG.auth.login,
        password: CONFIG.auth.password
      });
      
      this.authToken = response.data.accessToken;
      console.log('✅ Аутентификация успешна');
      return true;
    } catch (error) {
      console.error('❌ Ошибка аутентификации:', error.message);
      return false;
    }
  }

  // Создание HTTP клиента с токеном
  createHttpClient() {
    return axios.create({
      baseURL: CONFIG.baseURL,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // Тестовые сценарии
  getTestScenarios() {
    return [
      {
        name: 'Получение списка звонков',
        method: 'GET',
        url: '/calls',
        params: { page: 1, limit: 20 }
      },
      {
        name: 'Получение списка заказов',
        method: 'GET',
        url: '/orders',
        params: { page: 1, limit: 20 }
      },
      {
        name: 'Получение списка сотрудников',
        method: 'GET',
        url: '/employees',
        params: { page: 1, limit: 20 }
      },
      {
        name: 'Получение статистики',
        method: 'GET',
        url: '/stats/my',
        params: { 
          startDate: '2025-01-01', 
          endDate: '2025-12-31' 
        }
      },
      {
        name: 'Получение профиля',
        method: 'GET',
        url: '/auth/profile'
      }
    ];
  }

  // Выполнение одного запроса
  async executeRequest(client, scenario) {
    const startTime = performance.now();
    
    try {
      let response;
      
      if (scenario.method === 'GET') {
        response = await client.get(scenario.url, { params: scenario.params });
      } else if (scenario.method === 'POST') {
        response = await client.post(scenario.url, scenario.data);
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        success: true,
        responseTime,
        statusCode: response.status,
        scenario: scenario.name
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        success: false,
        responseTime,
        statusCode: error.response?.status || 0,
        error: error.message,
        scenario: scenario.name
      };
    }
  }

  // Симуляция пользователя
  async simulateUser(userId, scenarios, duration) {
    const client = this.createHttpClient();
    const userResults = [];
    const startTime = Date.now();
    
    console.log(`👤 Пользователь ${userId} начал работу`);
    
    while (Date.now() - startTime < duration * 1000) {
      // Выбираем случайный сценарий
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      const result = await this.executeRequest(client, scenario);
      userResults.push(result);
      
      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, CONFIG.testScenarios.requestDelay));
    }
    
    console.log(`👤 Пользователь ${userId} завершил работу (${userResults.length} запросов)`);
    return userResults;
  }

  // Запуск теста для определенного количества пользователей
  async runScenario(concurrentUsers) {
    console.log(`\n🚀 Запуск теста с ${concurrentUsers} пользователями...`);
    
    const scenarios = this.getTestScenarios();
    const duration = CONFIG.testScenarios.duration;
    
    // Создаем промисы для всех пользователей
    const userPromises = [];
    for (let i = 1; i <= concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i, scenarios, duration));
    }
    
    const startTime = performance.now();
    const allResults = await Promise.all(userPromises);
    const endTime = performance.now();
    
    // Обработка результатов
    const flatResults = allResults.flat();
    const successfulRequests = flatResults.filter(r => r.success);
    const failedRequests = flatResults.filter(r => !r.success);
    
    const responseTimes = flatResults.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    const totalTime = (endTime - startTime) / 1000; // в секундах
    const requestsPerSecond = flatResults.length / totalTime;
    
    const scenarioResult = {
      concurrentUsers,
      duration,
      totalRequests: flatResults.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: (successfulRequests.length / flatResults.length) * 100,
      averageResponseTime: Math.round(averageResponseTime),
      minResponseTime: Math.round(minResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errors: failedRequests.map(r => r.error).filter((v, i, a) => a.indexOf(v) === i)
    };
    
    this.results.scenarios.push(scenarioResult);
    
    console.log(`📊 Результаты для ${concurrentUsers} пользователей:`);
    console.log(`   Всего запросов: ${scenarioResult.totalRequests}`);
    console.log(`   Успешных: ${scenarioResult.successfulRequests} (${scenarioResult.successRate.toFixed(1)}%)`);
    console.log(`   Неудачных: ${scenarioResult.failedRequests}`);
    console.log(`   Среднее время ответа: ${scenarioResult.averageResponseTime}мс`);
    console.log(`   Мин/Макс время: ${scenarioResult.minResponseTime}мс / ${scenarioResult.maxResponseTime}мс`);
    console.log(`   Запросов в секунду: ${scenarioResult.requestsPerSecond}`);
    
    if (scenarioResult.errors.length > 0) {
      console.log(`   Ошибки: ${scenarioResult.errors.join(', ')}`);
    }
    
    return scenarioResult;
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log('🧪 Начало нагрузочного тестирования...\n');
    
    // Аутентификация
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.error('❌ Не удалось аутентифицироваться. Тестирование прервано.');
      return;
    }
    
    // Запуск тестов для разного количества пользователей
    for (const concurrentUsers of CONFIG.testScenarios.concurrentUsers) {
      await this.runScenario(concurrentUsers);
      
      // Пауза между тестами
      console.log('⏳ Пауза 5 секунд перед следующим тестом...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Генерация итогового отчета
    this.generateSummary();
    this.generateReport();
  }

  // Генерация сводки
  generateSummary() {
    const allResults = this.results.scenarios.flat();
    this.results.summary = {
      totalRequests: allResults.reduce((sum, r) => sum + r.totalRequests, 0),
      successfulRequests: allResults.reduce((sum, r) => sum + r.successfulRequests, 0),
      failedRequests: allResults.reduce((sum, r) => sum + r.failedRequests, 0),
      averageResponseTime: Math.round(
        allResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / allResults.length
      ),
      minResponseTime: Math.min(...allResults.map(r => r.minResponseTime)),
      maxResponseTime: Math.max(...allResults.map(r => r.maxResponseTime)),
      requestsPerSecond: Math.round(
        allResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / allResults.length * 100
      ) / 100
    };
  }

  // Генерация отчета
  generateReport() {
    console.log('\n📋 ИТОГОВЫЙ ОТЧЕТ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Общая статистика:`);
    console.log(`   Всего запросов: ${this.results.summary.totalRequests}`);
    console.log(`   Успешных: ${this.results.summary.successfulRequests}`);
    console.log(`   Неудачных: ${this.results.summary.failedRequests}`);
    console.log(`   Среднее время ответа: ${this.results.summary.averageResponseTime}мс`);
    console.log(`   Мин/Макс время: ${this.results.summary.minResponseTime}мс / ${this.results.summary.maxResponseTime}мс`);
    console.log(`   Среднее RPS: ${this.results.summary.requestsPerSecond}`);
    
    console.log(`\n📈 Результаты по сценариям:`);
    console.log('Пользователи | Запросов | Успех% | Ср.время | RPS');
    console.log('-'.repeat(50));
    
    this.results.scenarios.forEach(scenario => {
      console.log(
        `${scenario.concurrentUsers.toString().padStart(10)} | ` +
        `${scenario.totalRequests.toString().padStart(8)} | ` +
        `${scenario.successRate.toFixed(1).padStart(6)}% | ` +
        `${scenario.averageResponseTime.toString().padStart(8)}мс | ` +
        `${scenario.requestsPerSecond}`
      );
    });
    
    // Рекомендации
    console.log(`\n💡 Рекомендации:`);
    
    const maxUsers = Math.max(...this.results.scenarios.map(s => s.concurrentUsers));
    const maxUsersScenario = this.results.scenarios.find(s => s.concurrentUsers === maxUsers);
    
    if (maxUsersScenario.successRate < 95) {
      console.log(`   ⚠️  Низкий процент успешных запросов (${maxUsersScenario.successRate.toFixed(1)}%)`);
      console.log(`   Рекомендуется оптимизировать сервер или уменьшить нагрузку`);
    }
    
    if (maxUsersScenario.averageResponseTime > 1000) {
      console.log(`   ⚠️  Высокое время ответа (${maxUsersScenario.averageResponseTime}мс)`);
      console.log(`   Рекомендуется оптимизировать запросы к базе данных`);
    }
    
    if (maxUsersScenario.requestsPerSecond < 10) {
      console.log(`   ⚠️  Низкая пропускная способность (${maxUsersScenario.requestsPerSecond} RPS)`);
      console.log(`   Рекомендуется масштабирование сервера`);
    }
    
    console.log(`\n✅ Нагрузочное тестирование завершено!`);
  }
}

// Запуск тестирования
async function main() {
  const tester = new LoadTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LoadTester;
