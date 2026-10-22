import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoRole: (identifier: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('school_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('school_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('school_user', JSON.stringify(userData));
    } catch {
      logout();
    }
  };

  const login = async (identifier: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('school_token', newToken);
    localStorage.setItem('school_user', JSON.stringify(userData));
    return userData;
  };

  const switchDemoRole = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      await login(identifier, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
