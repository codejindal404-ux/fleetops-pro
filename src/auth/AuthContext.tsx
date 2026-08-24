import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Role } from '../types.ts';
import { Permission, hasPermission as checkPermission, hasAnyRole } from '../permissions/rolePermissions.ts';
import { apiClient } from '../services/apiClient.ts';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  verifyOtp: (pendingToken: string, code: string) => Promise<User>;
  resendOtp: (pendingToken: string) => Promise<any>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; phone?: string; newPassword?: string }) => Promise<User>;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fleetops_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('fleetops_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.getMe();
      setUser(res.user);
      setToken(savedToken);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      apiClient.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    return apiClient.login(email, password);
  };

  const verifyOtp = async (pendingToken: string, code: string): Promise<User> => {
    const res = await apiClient.verifyOtp(pendingToken, code);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const resendOtp = async (pendingToken: string) => {
    return apiClient.resendOtp(pendingToken);
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    const res = await apiClient.register(name, email, password, phone);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data: { name?: string; email?: string; phone?: string; newPassword?: string }): Promise<User> => {
    const res = await apiClient.updateProfile(data);
    setUser(res.user);
    return res.user;
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return hasAnyRole(user.role, roleList);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    verifyOtp,
    resendOtp,
    register,
    logout,
    updateProfile,
    hasRole,
    hasPermission,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
