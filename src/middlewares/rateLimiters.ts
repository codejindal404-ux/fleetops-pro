import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter for general auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // Limit each IP to 1000 in dev / 100 in prod per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests from this IP, please try again after 15 minutes' }
});

// Stricter rate limiter specifically for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 500 : 20, // 500 in dev / 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, try again later' }
});

// Sensitive rate limiter for 2FA, register, staff creation
export const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 500 : 50, // 500 in dev / 50 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, try again later' }
});

