import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests from this IP, please try again after 15 minutes' }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, try again later' }
});

export const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, try again later' }
});
