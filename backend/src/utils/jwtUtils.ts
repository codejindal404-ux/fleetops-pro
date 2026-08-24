import jwt from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { Role } from '../types/index.ts';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
