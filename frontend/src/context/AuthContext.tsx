import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services';

export interface User {
  id: string;
  userId?: string | number; // Legacy alias
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  preferredDestinations?: string[];
  travelInterests?: string[];
  budgetPreference?: string;
  preferredCurrency?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  agencyName?: string;
  websiteUrl?: string;
  specializations?: string;
  yearsOfExperience?: number;
  languages?: string[];
  verificationStatus?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithToken: (token: string) => Promise<User>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
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
    const payload = res.data;
    if (payload.success) {
      const u = payload.data?.user || payload;
      const authToken = payload.data?.token || payload.token;

      const userData: User = {
        id: u.id || u.userId || payload.userId,
        userId: u.id || u.userId || payload.userId,
        name: u.name || payload.name,
        email: u.email || payload.email,
        role: u.role || payload.role,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        isEmailVerified: u.isEmailVerified,
        preferredDestinations: u.preferredDestinations || [],
        travelInterests: u.travelInterests || [],
        budgetPreference: u.budgetPreference || 'Moderate',
        preferredCurrency: u.preferredCurrency || 'INR',
        country: u.country || 'India',
        state: u.state,
        city: u.city,
        address: u.address,
        postalCode: u.postalCode,
        bio: u.bio,
        dateOfBirth: u.dateOfBirth,
        gender: u.gender,
        agencyName: u.agencyName,
        websiteUrl: u.websiteUrl,
        specializations: u.specializations,
        yearsOfExperience: u.yearsOfExperience,
        languages: u.languages || [],
        verificationStatus: u.verificationStatus || 'VERIFIED',
      };

      setToken(authToken);
      setUser(userData);
      localStorage.setItem('wayrivo_token', authToken);
      localStorage.setItem('wayrivo_user', JSON.stringify(userData));
    }
    return payload;
  };

  const loginWithToken = async (authToken: string): Promise<User> => {
    localStorage.setItem('wayrivo_token', authToken);
    setToken(authToken);

    try {
      const res = await authService.getProfile();
      if (res.data?.success && res.data.data) {
        const u = res.data.data;
        const userData: User = {
          id: u.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          isEmailVerified: u.isEmailVerified,
          preferredDestinations: u.preferredDestinations || [],
          travelInterests: u.travelInterests || [],
          budgetPreference: u.budgetPreference || 'Moderate',
          preferredCurrency: u.preferredCurrency || 'INR',
          country: u.country || 'India',
          state: u.state,
          city: u.city,
          address: u.address,
          postalCode: u.postalCode,
          bio: u.bio,
          dateOfBirth: u.dateOfBirth,
          gender: u.gender,
          agencyName: u.agencyName,
          websiteUrl: u.websiteUrl,
          specializations: u.specializations,
          yearsOfExperience: u.yearsOfExperience,
          languages: u.languages || [],
          verificationStatus: u.verificationStatus || 'VERIFIED',
        };
        setUser(userData);
        localStorage.setItem('wayrivo_user', JSON.stringify(userData));
        return userData;
      }
      throw new Error('Failed to retrieve user profile.');
    } catch (err) {
      localStorage.removeItem('wayrivo_token');
      localStorage.removeItem('wayrivo_user');
      setToken(null);
      setUser(null);
      throw err;
    }
  };

  const register = async (formData: any) => {
    const res = await authService.register(formData);
    const payload = res.data;
    if (payload.success) {
      const u = payload.data?.user || payload;
      const authToken = payload.data?.token || payload.token;

      const userData: User = {
        id: u.id || u.userId,
        userId: u.id || u.userId,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        isEmailVerified: u.isEmailVerified,
      };

      setToken(authToken);
      setUser(userData);
      localStorage.setItem('wayrivo_token', authToken);
      localStorage.setItem('wayrivo_user', JSON.stringify(userData));
    }
    return payload;
  };

  const refreshProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.data?.success && res.data.data) {
        const u = res.data.data;
        const updated: User = {
          id: u.id,
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          isEmailVerified: u.isEmailVerified,
          preferredDestinations: u.preferredDestinations || [],
          travelInterests: u.travelInterests || [],
          budgetPreference: u.budgetPreference || 'Moderate',
          preferredCurrency: u.preferredCurrency || 'INR',
          country: u.country || 'India',
          state: u.state,
          city: u.city,
          address: u.address,
          postalCode: u.postalCode,
          bio: u.bio,
          dateOfBirth: u.dateOfBirth,
          gender: u.gender,
          agencyName: u.agencyName,
          websiteUrl: u.websiteUrl,
          specializations: u.specializations,
          yearsOfExperience: u.yearsOfExperience,
          languages: u.languages || [],
          verificationStatus: u.verificationStatus || 'VERIFIED',
        };
        setUser(updated);
        localStorage.setItem('wayrivo_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('wayrivo_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('wayrivo_token');
      localStorage.removeItem('wayrivo_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        updateUser,
        refreshProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
