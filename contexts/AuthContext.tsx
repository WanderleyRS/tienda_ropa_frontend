'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar token y usuario del localStorage al iniciar (SOLO UNA VEZ)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Cargar los estados de React. El interceptor de Axios usará el token de localStorage.
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verificar que el token sigue siendo válido (SOLO EN EL MOUNT INICIAL)
        authApi.getMe()
          .then((userData) => {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          })
          .catch(() => {
            // Si authApi.getMe() falla (ej. por 401), limpiar la sesión
            logout();
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío asegura que solo se ejecute UNA VEZ al montar

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);

      // Verificar que la respuesta tenga el token
      if (!response || !response.access_token) {
        throw new Error('No se recibió el token de acceso');
      }

      const token = response.access_token;
      const userData = response.user;

      // Guardar token y usuario
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);

        // Log para debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Login exitoso: Token y Usuario guardados');
        }
      }
    } catch (error: any) {
      // Si falla, limpiar todo
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      setToken(null);
      setUser(null);

      // Log del error para debugging
      console.error('Error en login:', error);
      throw error;
    }

  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
