const os = require('os');
const fs = require('fs');
const { performance } = require('perf_hooks');

class ResourceMonitor {
  constructor() {
    this.monitoring = false;
    this.metrics = [];
    this.startTime = null;
  }

  // Получение метрик системы
  getSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      timestamp: Date.now(),
      cpu: {
        usage: this.getCPUUsage(),
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 100)
      },
      loadAverage: os.loadavg(),
      uptime: os.uptime()
    };
  }

  // Получение использования CPU
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.round(100 - (100 * totalIdle / totalTick));
  }

  // Получение метрик процесса Node.js
  getProcessMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      pid: process.pid
    };
  }

  // Получение метрик базы данных (если доступно)
  async getDatabaseMetrics() {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const [callCount, orderCount, operatorCount] = await Promise.all([
        prisma.call.count(),
        prisma.order.count(),
        prisma.callcentreOperator.count()
      ]);

      await prisma.$disconnect();

      return {
        tables: {
          calls: callCount,
          orders: orderCount,
          operators: operatorCount
        }
      };
    } catch (error) {
      return {
        error: 'Не удалось получить метрики базы данных'
      };
    }
  }

  // Запуск мониторинга
  async startMonitoring(intervalMs = 1000) {
    if (this.monitoring) {
      console.log('⚠️  Мониторинг уже запущен');
      return;
    }

    this.monitoring = true;
    this.startTime = Date.now();
    this.metrics = [];

    console.log(`🔍 Запуск мониторинга ресурсов (интервал: ${intervalMs}мс)...`);

    const monitor = async () => {
      if (!this.monitoring) return;

      try {
        const systemMetrics = this.getSystemMetrics();
        const processMetrics = this.getProcessMetrics();
        const dbMetrics = await this.getDatabaseMetrics();

        const combinedMetrics = {
          ...systemMetrics,
          process: processMetrics,
          database: dbMetrics
        };

        this.metrics.push(combinedMetrics);

        // Вывод текущих метрик
        console.log(
          `📊 CPU: ${systemMetrics.cpu.usage}% | ` +
          `RAM: ${systemMetrics.memory.usagePercent}% | ` +
          `Heap: ${Math.round(processMetrics.memory.heapUsed / 1024 / 1024)}MB | ` +
          `Время: ${new Date().toLocaleTimeString()}`
        );

      } catch (error) {
        console.error('❌ Ошибка при получении метрик:', error.message);
      }

      setTimeout(monitor, intervalMs);
    };

    monitor();
  }

  // Остановка мониторинга
  stopMonitoring() {
    if (!this.monitoring) {
      console.log('⚠️  Мониторинг не запущен');
      return;
    }

    this.monitoring = false;
    console.log('⏹️  Мониторинг остановлен');
  }

  // Генерация отчета
  generateReport() {
    if (this.metrics.length === 0) {
      console.log('❌ Нет данных для генерации отчета');
      return;
    }

    console.log('\n📋 ОТЧЕТ МОНИТОРИНГА РЕСУРСОВ');
    console.log('='.repeat(60));

    const duration = (Date.now() - this.startTime) / 1000;
    console.log(`\n⏱️  Период мониторинга: ${Math.round(duration)} секунд`);
    console.log(`📊 Количество измерений: ${this.metrics.length}`);

    // Анализ CPU
    const cpuUsages = this.metrics.map(m => m.cpu.usage);
    const avgCpu = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
    const maxCpu = Math.max(...cpuUsages);
    const minCpu = Math.min(...cpuUsages);

    console.log(`\n🖥️  CPU:`);
    console.log(`   Среднее использование: ${Math.round(avgCpu)}%`);
    console.log(`   Максимальное: ${maxCpu}%`);
    console.log(`   Минимальное: ${minCpu}%`);
    console.log(`   Количество ядер: ${this.metrics[0].cpu.cores}`);

    // Анализ памяти
    const memoryUsages = this.metrics.map(m => m.memory.usagePercent);
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const maxMemory = Math.max(...memoryUsages);
    const minMemory = Math.min(...memoryUsages);

    const totalMemGB = Math.round(this.metrics[0].memory.total / 1024 / 1024 / 1024);
    const avgUsedMemGB = Math.round((avgMemory / 100) * totalMemGB);

    console.log(`\n💾 Память:`);
    console.log(`   Общий объем: ${totalMemGB}GB`);
    console.log(`   Среднее использование: ${Math.round(avgMemory)}% (${avgUsedMemGB}GB)`);
    console.log(`   Максимальное: ${maxMemory}%`);
    console.log(`   Минимальное: ${minMemory}%`);

    // Анализ heap памяти Node.js
    const heapUsages = this.metrics.map(m => m.process.memory.heapUsed);
    const avgHeap = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;
    const maxHeap = Math.max(...heapUsages);
    const minHeap = Math.min(...heapUsages);

    console.log(`\n🗂️  Heap память Node.js:`);
    console.log(`   Среднее использование: ${Math.round(avgHeap / 1024 / 1024)}MB`);
    console.log(`   Максимальное: ${Math.round(maxHeap / 1024 / 1024)}MB`);
    console.log(`   Минимальное: ${Math.round(minHeap / 1024 / 1024)}MB`);

    // Анализ нагрузки системы
    const loadAverages = this.metrics.map(m => m.loadAverage[0]);
    const avgLoad = loadAverages.reduce((a, b) => a + b, 0) / loadAverages.length;
    const maxLoad = Math.max(...loadAverages);

    console.log(`\n⚖️  Нагрузка системы:`);
    console.log(`   Средняя нагрузка (1 мин): ${Math.round(avgLoad * 100) / 100}`);
    console.log(`   Максимальная нагрузка: ${Math.round(maxLoad * 100) / 100}`);

    // Рекомендации
    console.log(`\n💡 Рекомендации:`);

    if (avgCpu > 80) {
      console.log(`   ⚠️  Высокое использование CPU (${Math.round(avgCpu)}%)`);
      console.log(`   Рекомендуется оптимизировать код или увеличить количество ядер`);
    }

    if (avgMemory > 80) {
      console.log(`   ⚠️  Высокое использование памяти (${Math.round(avgMemory)}%)`);
      console.log(`   Рекомендуется увеличить объем RAM или оптимизировать использование памяти`);
    }

    if (avgHeap > 500 * 1024 * 1024) { // 500MB
      console.log(`   ⚠️  Высокое использование heap памяти (${Math.round(avgHeap / 1024 / 1024)}MB)`);
      console.log(`   Рекомендуется проверить на утечки памяти`);
    }

    if (avgLoad > this.metrics[0].cpu.cores) {
      console.log(`   ⚠️  Высокая системная нагрузка (${Math.round(avgLoad)})`);
      console.log(`   Система перегружена, рекомендуется масштабирование`);
    }

    // Сохранение отчета в файл
    this.saveReportToFile();
  }

  // Сохранение отчета в файл
  saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: (Date.now() - this.startTime) / 1000,
      metricsCount: this.metrics.length,
      summary: this.getSummaryMetrics(),
      rawMetrics: this.metrics
    };

    const filename = `resource-monitor-report-${Date.now()}.json`;
    const filepath = `./load-testing/reports/${filename}`;

    // Создаем директорию если не существует
    const fs = require('fs');
    if (!fs.existsSync('./load-testing/reports')) {
      fs.mkdirSync('./load-testing/reports', { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Отчет сохранен в файл: ${filepath}`);
  }

  // Получение сводных метрик
  getSummaryMetrics() {
    const cpuUsages = this.metrics.map(m => m.cpu.usage);
    const memoryUsages = this.metrics.map(m => m.memory.usagePercent);
    const heapUsages = this.metrics.map(m => m.process.memory.heapUsed);

    return {
      cpu: {
        average: Math.round(cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length),
        max: Math.max(...cpuUsages),
        min: Math.min(...cpuUsages)
      },
      memory: {
        average: Math.round(memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length),
        max: Math.max(...memoryUsages),
        min: Math.min(...memoryUsages)
      },
      heap: {
        average: Math.round(heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length),
        max: Math.max(...heapUsages),
        min: Math.min(...heapUsages)
      }
    };
  }
}

// CLI интерфейс
if (require.main === module) {
  const monitor = new ResourceMonitor();
  
  // Обработка сигналов для корректного завершения
  process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал завершения...');
    monitor.stopMonitoring();
    monitor.generateReport();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал завершения...');
    monitor.stopMonitoring();
    monitor.generateReport();
    process.exit(0);
  });

  // Запуск мониторинга
  const interval = process.argv[2] ? parseInt(process.argv[2]) : 1000;
  monitor.startMonitoring(interval);

  console.log('Нажмите Ctrl+C для остановки мониторинга и генерации отчета');
}

module.exports = ResourceMonitor;
