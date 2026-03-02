import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { UserSettings, LlmProvider } from '../types';
import { loadUserData, saveUserData } from '../utils/userStorage';
import { fetchSettings, upsertSettings } from '../services/data/supabaseData';
import { useAuth } from './AuthContext';

const defaultSettings: UserSettings = {
  llmProvider: 'anthropic',
  apiKey: '',
};

interface SettingsContextValue {
  settings: UserSettings;
  updateApiKey: (key: string) => void;
  updateLlmProvider: (provider: LlmProvider) => void;
  hasApiKey: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const { sessionPassword } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadUserData<UserSettings>(userId, 'settings') ?? defaultSettings
  );
  const isInitialMount = useRef(true);
  const isSyncingFromCloud = useRef(false);

  // Load from localStorage on userId change
  useEffect(() => {
    setSettings(loadUserData<UserSettings>(userId, 'settings') ?? defaultSettings);
  }, [userId]);

  // Fetch from Supabase on mount / userId change
  // If password is available, decrypt the cloud API key; otherwise keep local
  useEffect(() => {
    if (!sessionPassword) return;
    fetchSettings(userId, sessionPassword).then((cloud) => {
      if (cloud !== null) {
        isSyncingFromCloud.current = true;
        setSettings(cloud);
        saveUserData(userId, 'settings', cloud);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionPassword]);

  // Save to localStorage + Supabase on changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isSyncingFromCloud.current) {
      isSyncingFromCloud.current = false;
      return;
    }
    saveUserData(userId, 'settings', settings);
    if (sessionPassword) {
      upsertSettings(userId, settings, sessionPassword);
    }
  }, [userId, settings, sessionPassword]);

  const updateApiKey = useCallback((key: string) => {
    setSettings((prev) => ({ ...prev, apiKey: key }));
  }, []);

  const updateLlmProvider = useCallback((provider: LlmProvider) => {
    setSettings((prev) => ({ ...prev, llmProvider: provider }));
  }, []);

  const hasApiKey = settings.apiKey.trim().length > 0;

  const value = useMemo(() => ({
    settings,
    updateApiKey,
    updateLlmProvider,
    hasApiKey,
  }), [settings, updateApiKey, updateLlmProvider, hasApiKey]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
