import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, STORE_NAME } from '../lib/supabase';
import {
  DEFAULT_STORE_SETTINGS,
  fetchStoreSettings,
} from '../services/settingsService';
import type { StoreSettings } from '../types';

interface StoreSettingsContextValue {
  settings: StoreSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  setSettingsLocal: (next: StoreSettings) => void;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | undefined>(
  undefined
);

function applyFaviconToDocument(faviconUrl: string | null) {
  const head = document.head;
  if (!head) return;

  const existingIcons = head.querySelectorAll(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  existingIcons.forEach((el) => el.remove());

  if (!faviconUrl) return;

  const iconLink = document.createElement('link');
  iconLink.rel = 'icon';
  iconLink.href = faviconUrl;
  head.appendChild(iconLink);

  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrl;
  head.appendChild(appleLink);
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchStoreSettings();
      setSettings(data);
    } catch {
      setSettings(DEFAULT_STORE_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    applyFaviconToDocument(settings.favicon_url);
    const name = settings.store_name || STORE_NAME;
    document.title = `${name} — Jajanan & Camilan Tradisional Pilihan`;
  }, [settings.favicon_url, settings.store_name]);

  const setSettingsLocal = useCallback((next: StoreSettings) => {
    setSettings(next);
  }, []);

  const value = useMemo<StoreSettingsContextValue>(
    () => ({
      settings,
      loading,
      refreshSettings,
      setSettingsLocal,
    }),
    [settings, loading, refreshSettings, setSettingsLocal]
  );

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettingsContextValue {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error(
      'useStoreSettings harus digunakan di dalam StoreSettingsProvider'
    );
  }
  return ctx;
}
