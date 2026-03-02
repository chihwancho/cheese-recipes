import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { AuthUser, AuthProvider as AuthProviderInterface, AuthProviderType } from '../services/auth/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** In-memory only — available after login/register, null after session restore. */
  sessionPassword: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithOAuth: (provider: AuthProviderType) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  authProvider: AuthProviderInterface;
}

export function AuthProvider({ children, authProvider }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);

  useEffect(() => {
    authProvider.restoreSession().then((restored) => {
      if (restored) setUser(restored);
      setIsLoading(false);
    });

    // Listen for token refresh / sign-out events
    if (!authProvider.onAuthStateChange) return;
    const unsubscribe = authProvider.onAuthStateChange((updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        // Session expired or was revoked
        setUser(null);
        setSessionPassword(null);
      }
    });
    return unsubscribe;
  }, [authProvider]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    const result = await authProvider.login(email, password);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      setSessionPassword(password);
      return true;
    }
    setError(result.error ?? 'Login failed.');
    return false;
  }, [authProvider]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    setIsLoading(true);
    const result = await authProvider.register(email, password, displayName);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      setSessionPassword(password);
      return true;
    }
    setError(result.error ?? 'Registration failed.');
    return false;
  }, [authProvider]);

  const logout = useCallback(async () => {
    await authProvider.logout();
    setUser(null);
    setError(null);
    setSessionPassword(null);
  }, [authProvider]);

  const loginWithOAuth = useCallback(async (providerType: AuthProviderType) => {
    if (!authProvider.loginWithOAuth) {
      setError('OAuth login is not yet available.');
      return false;
    }
    setError(null);
    setIsLoading(true);
    const result = await authProvider.loginWithOAuth(providerType);
    setIsLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      return true;
    }
    setError(result.error ?? 'OAuth login failed.');
    return false;
  }, [authProvider]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    sessionPassword,
    login,
    register,
    logout,
    loginWithOAuth,
    clearError,
  }), [user, isLoading, error, sessionPassword, login, register, logout, loginWithOAuth, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
