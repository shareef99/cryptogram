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
  onboardingSeen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAdsRemoved: (v: boolean) => Promise<void>;
  setSoundEnabled: (v: boolean) => Promise<void>;
  setThemeMode: (v: ThemeMode) => Promise<void>;
  setOnboardingSeen: (v: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  adsRemoved: false,
  soundEnabled: true,
  themeMode: 'system',
  onboardingSeen: false,
  hydrated: false,

  hydrate: async () => {
    const db = await getDatabase();
    const [adsRemoved, soundEnabled, themeMode, onboardingSeen] = await Promise.all([
      getBoolSetting(db, SETTING_KEYS.adsRemoved, false),
      getBoolSetting(db, SETTING_KEYS.sound, true),
      getSetting(db, SETTING_KEYS.themeMode),
      getBoolSetting(db, SETTING_KEYS.onboardingSeen, false),
    ]);
    set({
      adsRemoved,
      soundEnabled,
      themeMode: (themeMode as ThemeMode) ?? 'system',
      onboardingSeen,
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

  setOnboardingSeen: async (v) => {
    const db = await getDatabase();
    await setBoolSetting(db, SETTING_KEYS.onboardingSeen, v);
    set({ onboardingSeen: v });
  },
}));
