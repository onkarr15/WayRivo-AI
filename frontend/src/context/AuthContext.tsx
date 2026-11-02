import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services';

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('wayrivo_token');
    const savedUser = localStorage.getItem('wayrivo_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('wayrivo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    const data = res.data;
    if (data.success) {
      const userData: User = { userId: data.userId, name: data.name, email: data.email, role: data.role };
      setToken(data.token);
      setUser(userData);
      localStorage.setItem('wayrivo_token', data.token);
      localStorage.setItem('wayrivo_user', JSON.stringify(userData));
    }
    return data;
  };

  const register = async (formData: any) => {
    const res = await authService.register(formData);
    const data = res.data;
    if (data.success) {
      const userData: User = { userId: data.userId, name: data.name, email: data.email, role: data.role };
      setToken(data.token);
      setUser(userData);
      localStorage.setItem('wayrivo_token', data.token);
      localStorage.setItem('wayrivo_user', JSON.stringify(userData));
    }
    return data;
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('wayrivo_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wayrivo_token');
    localStorage.removeItem('wayrivo_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
