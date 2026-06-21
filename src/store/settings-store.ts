/**
 * App settings mirror (ads-removed flag, sound). Backed by the settings table.
 */

import { create } from 'zustand';

import { getBoolSetting, getDatabase, getSetting, setBoolSetting, setSetting, SETTING_KEYS } from '@/db';
import type { ThemeMode } from '@/types';

export type { ThemeMode } from '@/types';

type SettingsState = {
  adsRemoved: boolean;
  soundEnabled: boolean;
  themeMode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAdsRemoved: (v: boolean) => Promise<void>;
  setSoundEnabled: (v: boolean) => Promise<void>;
  setThemeMode: (v: ThemeMode) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  adsRemoved: false,
  soundEnabled: true,
  themeMode: 'system',
  hydrated: false,

  hydrate: async () => {
    const db = await getDatabase();
    const [adsRemoved, soundEnabled, themeMode] = await Promise.all([
      getBoolSetting(db, SETTING_KEYS.adsRemoved, false),
      getBoolSetting(db, SETTING_KEYS.sound, true),
      getSetting(db, SETTING_KEYS.themeMode),
    ]);
    set({
      adsRemoved,
      soundEnabled,
      themeMode: (themeMode as ThemeMode) ?? 'system',
      hydrated: true,
    });
  },

  setAdsRemoved: async (v) => {
    const db = await getDatabase();
    await setBoolSetting(db, SETTING_KEYS.adsRemoved, v);
    set({ adsRemoved: v });
  },

  setSoundEnabled: async (v) => {
    const db = await getDatabase();
    await setBoolSetting(db, SETTING_KEYS.sound, v);
    set({ soundEnabled: v });
  },

  setThemeMode: async (v) => {
    const db = await getDatabase();
    await setSetting(db, SETTING_KEYS.themeMode, v);
    set({ themeMode: v });
  },
}));
