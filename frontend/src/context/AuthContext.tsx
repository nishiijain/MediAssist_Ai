import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: 'doctor' | 'patient' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithResponse: (data: AuthResponse, remember?: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'medicassist_token';
const USER_KEY = 'medicassist_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;

  // On mount, verify existing token with backend /auth/me
  useEffect(() => {
    const initAuth = async () => {
      const activeToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (activeToken) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          if (localStorage.getItem(TOKEN_KEY)) {
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          } else {
            sessionStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          }
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginWithResponse = (data: AuthResponse, remember: boolean = true) => {
    setToken(data.access_token);
    setUser(data.user);

    const storage = remember ? localStorage : sessionStorage;
    const altStorage = remember ? sessionStorage : localStorage;

    altStorage.removeItem(TOKEN_KEY);
    altStorage.removeItem(USER_KEY);

    storage.setItem(TOKEN_KEY, data.access_token);
    storage.setItem(USER_KEY, JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        loginWithResponse,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
