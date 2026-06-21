/**
 * App settings mirror (ads-removed flag, sound). Backed by the settings table.
 */

import { create } from 'zustand';

import { getBoolSetting, getDatabase, setBoolSetting, SETTING_KEYS } from '@/db';

type SettingsState = {
  adsRemoved: boolean;
  soundEnabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAdsRemoved: (v: boolean) => Promise<void>;
  setSoundEnabled: (v: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  adsRemoved: false,
  soundEnabled: true,
  hydrated: false,

  hydrate: async () => {
    const db = await getDatabase();
    const [adsRemoved, soundEnabled] = await Promise.all([
      getBoolSetting(db, SETTING_KEYS.adsRemoved, false),
      getBoolSetting(db, SETTING_KEYS.sound, true),
    ]);
    set({ adsRemoved, soundEnabled, hydrated: true });
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
}));
