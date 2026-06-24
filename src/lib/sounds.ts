/**
 * Fire-and-forget sound effects via expo-audio. Players are created lazily and
 * reused; each call respects the Sound setting and never throws (audio is
 * best-effort, like haptics).
 */

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/store/settings-store';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  win: require('../../assets/sounds/win.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function getPlayer(name: SoundName): AudioPlayer {
  return (players[name] ??= createAudioPlayer(SOURCES[name]));
}

export const sounds = {
  /** Play a short effect if sound is enabled. Restarts if already playing. */
  play(name: SoundName) {
    try {
      if (!useSettingsStore.getState().soundEnabled) return;
      const p = getPlayer(name);
      p.seekTo(0);
      p.play();
    } catch {
      /* best-effort */
    }
  },
};
