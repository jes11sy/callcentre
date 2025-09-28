import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface SSLConfig {
  enabled: boolean;
  keyPath?: string;
  certPath?: string;
  caPath?: string;
  passphrase?: string;
}

/**
 * Загрузка SSL конфигурации
 */
export const getSSLConfig = (): SSLConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sslEnabled = process.env.SSL_ENABLED === 'true' || isProduction;

  if (!sslEnabled) {
    logger.info('SSL disabled for development environment');
    return { enabled: false };
  }

  const sslDir = process.env.SSL_CERT_DIR || '/etc/ssl/certs/callcentre';
  const keyPath = path.join(sslDir, 'private.key');
  const certPath = path.join(sslDir, 'certificate.crt');
  const caPath = path.join(sslDir, 'ca_bundle.crt');

  // Проверяем наличие обязательных SSL файлов
  try {
    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSL private key not found: ${keyPath}`);
    }
    if (!fs.existsSync(certPath)) {
      throw new Error(`SSL certificate not found: ${certPath}`);
    }

    logger.info('SSL certificates found and loaded successfully');
    
    return {
      enabled: true,
      keyPath,
      certPath,
      caPath: fs.existsSync(caPath) ? caPath : undefined,
      passphrase: process.env.SSL_PASSPHRASE,
    };
  } catch (error) {
    logger.error('Failed to load SSL certificates:', error);
    
    if (isProduction) {
      logger.warn('SSL certificates not found, running without HTTPS in production');
      return { enabled: false };
    }
    
    logger.warn('Falling back to HTTP in development');
    return { enabled: false };
  }
};

/**
 * Загрузка SSL файлов для HTTPS сервера
 */
export const loadSSLFiles = (config: SSLConfig) => {
  if (!config.enabled || !config.keyPath || !config.certPath) {
    return null;
  }

  try {
    const sslOptions = {
      key: fs.readFileSync(config.keyPath, 'utf8'),
      cert: fs.readFileSync(config.certPath, 'utf8'),
      ca: config.caPath ? fs.readFileSync(config.caPath, 'utf8') : undefined,
      passphrase: config.passphrase,
    };

    logger.info('SSL files loaded successfully');
    return sslOptions;
  } catch (error) {
    logger.error('Failed to read SSL files:', error);
    throw error;
  }
};

/**
 * Middleware для принудительного HTTPS redirect
 */
export const httpsRedirectMiddleware = (req: any, res: any, next: any) => {
  // Проверяем заголовки от прокси (nginx, cloudflare, etc.)
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['x-forwarded-ssl'] === 'on' ||
                   req.connection.encrypted;

  // В продакшене принудительно перенаправляем на HTTPS
  if (process.env.NODE_ENV === 'production' && !isSecure) {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    logger.warn(`HTTP request redirected to HTTPS: ${req.url}`);
    return res.redirect(301, httpsUrl);
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = (req: any, res: any, next: any) => {
  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const frontendDomain = process.env.FRONTEND_DOMAIN || 'localhost:3000';
  const backendDomain = process.env.BACKEND_DOMAIN || 'localhost:5000';
  
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://${backendDomain} wss://${backendDomain} https://api.avito.ru https://app.mango-office.ru`,
    "media-src 'self'",
    "frame-ancestors 'none'",
    `form-action 'self' https://${frontendDomain}`,
  ].join('; '));

  // Дополнительные security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};
