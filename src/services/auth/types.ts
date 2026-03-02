export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProviderType;
}

export type AuthProviderType = 'local' | 'supabase' | 'google' | 'github' | 'microsoft';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface AuthProvider {
  login(email: string, password: string): Promise<AuthResult>;
  register(email: string, password: string, displayName: string): Promise<AuthResult>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthUser | null>;
  loginWithOAuth?(providerType: AuthProviderType): Promise<AuthResult>;
}
