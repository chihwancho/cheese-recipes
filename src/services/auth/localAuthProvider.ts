import type { AuthProvider, AuthResult, AuthUser } from './types';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

const USERS_KEY = 'mealplan_users';
const SESSION_KEY = 'mealplan_session';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function createLocalAuthProvider(): AuthProvider {
  return {
    async login(email, password) {
      const users = getStoredUsers();
      const found = users.find(
        (u) => u.email === email.toLowerCase() && u.passwordHash === simpleHash(password)
      );
      if (!found) {
        return { success: false, error: 'Invalid email or password.' };
      }
      const user: AuthUser = {
        id: found.id,
        email: found.email,
        displayName: found.displayName,
        provider: 'local',
      };
      setSession(user);
      return { success: true, user };
    },

    async register(email, password, displayName) {
      const users = getStoredUsers();
      if (users.some((u) => u.email === email.toLowerCase())) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        displayName,
        passwordHash: simpleHash(password),
      };
      users.push(newUser);
      saveStoredUsers(users);
      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        provider: 'local',
      };
      setSession(authUser);
      return { success: true, user: authUser };
    },

    async logout() {
      clearSession();
    },

    async restoreSession() {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as AuthUser;
      } catch {
        clearSession();
        return null;
      }
    },
  };
}
