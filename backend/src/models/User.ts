import { Role } from '../types/index.ts';

export interface UserModel {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  phone?: string;
  address?: string;
  isSuspended?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}
