import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { Server } from 'socket.io';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { getSSLConfig, loadSSLFiles, httpsRedirectMiddleware, securityHeadersMiddleware } from './config/ssl';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { 
  apiRateLimit, 
  authRateLimit, 
  sanitizeInput, 
  securityHeaders, 
  requestSizeLimit,
  sessionTimeout 
} from './middleware/security';
import routes from './routes';
import cronService from './services/cronService';
import { initializeEternalOnlineProcesses, stopAllEternalOnlineProcesses } from './services/eternalOnlineService';

const app = express();

// Определяем разрешенные origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://callcentre.lead-schem.ru',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Настройка SSL и серверов
const sslConfig = getSSLConfig();
let server: any;
let httpsServer: any;

if (sslConfig.enabled) {
  const sslOptions = loadSSLFiles(sslConfig);
  if (sslOptions) {
    // HTTPS сервер для продакшена
    httpsServer = createHttpsServer(sslOptions, app);
    // HTTP сервер для редиректа на HTTPS
    server = createServer(app);
    logger.info('SSL enabled - HTTPS server will be created');
  } else {
    server = createServer(app);
    logger.warn('SSL files not found - falling back to HTTP');
  }
} else {
  server = createServer(app);
  logger.info('SSL disabled - using HTTP server');
}

// Socket.IO настройка
const primaryServer = httpsServer || server;
const io = new Server(primaryServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Trust proxy for proper IP addresses
app.set('trust proxy', 1);

// HTTPS redirect middleware (только если SSL включен)
if (sslConfig.enabled) {
  app.use(httpsRedirectMiddleware);
}

// Custom security headers
app.use(securityHeadersMiddleware);

// Security headers
app.use(securityHeaders);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

// Rate limiting (disabled in development)
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/auth', authRateLimit);
  app.use('/api', apiRateLimit);
}

// Request size limiting
app.use(requestSizeLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Session timeout (24 hours)
app.use(sessionTimeout(24 * 60 * 60 * 1000));

// Request logging
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Real-time events for CRM
  socket.on('join-operator', (operatorId) => {
    socket.join(`operator-${operatorId}`);
    logger.info(`Operator ${operatorId} joined room`);
  });

  socket.on('new-call', (callData) => {
    // Broadcast new call to all operators
    socket.broadcast.emit('call-notification', callData);
  });

  socket.on('new-order', (orderData) => {
    // Broadcast new order to relevant operators
    socket.broadcast.emit('order-notification', orderData);
  });
});

// Graceful shutdown
const shutdownGracefully = async () => {
  logger.info('Shutdown signal received, closing servers gracefully');
  await stopAllEternalOnlineProcesses();
  cronService.stop();
  
  // Закрываем все серверы
  const closePromises = [];
  if (server) {
    closePromises.push(new Promise((resolve) => server.close(resolve)));
  }
  if (httpsServer) {
    closePromises.push(new Promise((resolve) => httpsServer.close(resolve)));
  }
  
  await Promise.all(closePromises);
  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start cron services
    cronService.start();
    
    // Initialize eternal online processes
    await initializeEternalOnlineProcesses();
    
    const HTTP_PORT = process.env.HTTP_PORT || PORT;
    const HTTPS_PORT = process.env.HTTPS_PORT || 443;
    
    // Запускаем серверы
    if (httpsServer) {
      // Запускаем HTTPS сервер на порту 443
      httpsServer.listen(HTTPS_PORT, () => {
        logger.info(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
        logger.info(`📡 Socket.io server ready (HTTPS)`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
      
      // Запускаем HTTP сервер на порту HTTP_PORT для внутреннего проксирования через nginx
      server.listen(HTTP_PORT, () => {
        logger.info(`🚀 HTTP Server running on port ${HTTP_PORT} (behind nginx)`);
      });
    } else {
      // Запускаем только HTTP сервер (development)
      server.listen(HTTP_PORT, () => {
        logger.info(`🚀 HTTP Server running on port ${HTTP_PORT}`);
        logger.info(`📡 Socket.io server ready (HTTP)`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    }
    
    // Логируем SSL статус
    if (sslConfig.enabled) {
      logger.info(`🔒 SSL/TLS encryption enabled`);
      logger.info(`📝 Certificate path: ${sslConfig.certPath}`);
    } else {
      logger.warn(`⚠️  SSL/TLS encryption disabled - not recommended for production`);
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
