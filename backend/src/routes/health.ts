import { Router, Request, Response } from 'express';
import net from 'net';
import { URL } from 'url';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { getSSLConfig } from '../config/ssl';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  ssl: {
    enabled: boolean;
    certificatePath?: string;
    secureConnection: boolean;
  };
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
  errors?: string[];
}

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const errors: string[] = [];
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

  try {
    // SSL configuration check
    const sslConfig = getSSLConfig();
    const isSecureConnection = req.secure || 
                              req.headers['x-forwarded-proto'] === 'https' ||
                              req.headers['x-forwarded-ssl'] === 'on';

    // Database connectivity check
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
      errors.push(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      overallStatus = 'unhealthy';
    }

    // Redis connectivity check (if available)
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      const redisUrlString = process.env.REDIS_URL || 'redis://redis:6379';
      const parsed = new URL(redisUrlString);
      const redisHost = parsed.hostname || 'redis';
      const redisPort = Number(parsed.port) || 6379;
      const redisPassword = decodeURIComponent(parsed.password || process.env.REDIS_PASSWORD || '');

      const sendCommand = (socket: net.Socket, parts: string[]): void => {
        const bulk = parts
          .map((p) => `$${Buffer.byteLength(p)}\r\n${p}\r\n`)
          .join('');
        const payload = `*${parts.length}\r\n${bulk}`;
        socket.write(payload);
      };

      const checkRedis = async (): Promise<'connected' | 'disconnected' | 'error'> => {
        return await new Promise((resolve) => {
          const socket = net.createConnection({ host: redisHost, port: redisPort });
          let buffer = '';
          let authed = false;
          let finished = false;

          const cleanup = (status: 'connected' | 'disconnected' | 'error') => {
            if (finished) return;
            finished = true;
            try { socket.destroy(); } catch {}
            resolve(status);
          };

          socket.setTimeout(4000, () => cleanup('error'));

          socket.on('error', () => cleanup('error'));

          socket.on('connect', () => {
            try {
              if (redisPassword) {
                sendCommand(socket, ['AUTH', redisPassword]);
              } else {
                sendCommand(socket, ['PING']);
              }
            } catch {
              cleanup('error');
            }
          });

          socket.on('data', (data) => {
            buffer += data.toString();

            if (!authed && redisPassword) {
              if (buffer.startsWith('+OK')) {
                authed = true;
                buffer = '';
                sendCommand(socket, ['PING']);
                return;
              }
              if (buffer.startsWith('-ERR') || buffer.startsWith('-NOAUTH')) {
                return cleanup('error');
              }
            } else {
              if (buffer.includes('+PONG')) {
                return cleanup('connected');
              }
              if (buffer.startsWith('-ERR') || buffer.startsWith('-NOAUTH')) {
                return cleanup('error');
              }
            }
          });
        });
      };

      redisStatus = await checkRedis();
      if (redisStatus !== 'connected') {
        errors.push('Redis connectivity issue');
      }
    } catch (e) {
      redisStatus = 'error';
      errors.push(`Redis check failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    // SSL warnings for production
    if (process.env.NODE_ENV === 'production') {
      if (!sslConfig.enabled) {
        errors.push('SSL is disabled in production environment');
        overallStatus = 'unhealthy';
      }
      if (!isSecureConnection) {
        errors.push('Request not received over HTTPS in production');
        // Don't mark as unhealthy since this might be a load balancer health check
      }
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      ssl: {
        enabled: sslConfig.enabled,
        certificatePath: sslConfig.certPath,
        secureConnection: isSecureConnection,
      },
      services: {
        database: databaseStatus,
        redis: redisStatus,
      },
      memory: {
        used: `${Math.round(usedMem / 1024 / 1024)}MB`,
        total: `${Math.round(totalMem / 1024 / 1024)}MB`,
        percentage: memPercentage,
      },
    };

    if (errors.length > 0) {
      healthCheck.errors = errors;
    }

    const responseTime = Date.now() - startTime;
    
    // Log health check
    if (overallStatus === 'healthy') {
      logger.info(`Health check passed in ${responseTime}ms`, {
        ssl: healthCheck.ssl,
        memory: healthCheck.memory,
      });
    } else {
      logger.warn(`Health check failed in ${responseTime}ms`, {
        errors,
        ssl: healthCheck.ssl,
      });
    }

    // Set appropriate HTTP status
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    logger.error('Health check endpoint error:', error);
    
    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      ssl: {
        enabled: false,
        secureConnection: false,
      },
      services: {
        database: 'error',
        redis: 'error',
      },
      memory: {
        used: '0MB',
        total: '0MB',
        percentage: 0,
      },
      errors: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };

    res.status(503).json(errorHealthCheck);
  }
});

/**
 * Simple ping endpoint for load balancers
 * GET /api/health/ping
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * SSL-specific health check
 * GET /api/health/ssl
 */
router.get('/ssl', (req: Request, res: Response) => {
  try {
    const sslConfig = getSSLConfig();
    const isSecureConnection = req.secure || 
                              req.headers['x-forwarded-proto'] === 'https' ||
                              req.headers['x-forwarded-ssl'] === 'on';

    const sslHealth = {
      enabled: sslConfig.enabled,
      certificatePath: sslConfig.certPath,
      secureConnection: isSecureConnection,
      environment: process.env.NODE_ENV || 'development',
      headers: {
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-ssl': req.headers['x-forwarded-ssl'],
      },
      timestamp: new Date().toISOString(),
    };

    logger.info('SSL health check requested', sslHealth);

    res.status(200).json(sslHealth);
  } catch (error) {
    logger.error('SSL health check failed:', error);
    res.status(500).json({
      error: 'SSL health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
