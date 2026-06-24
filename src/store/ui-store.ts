/**
 * Ephemeral UI state (not persisted): currently just the "How to play" overlay
 * visibility, so both first-run (Home) and the Settings button can show it.
 */

import { create } from 'zustand';

type UiState = {
  helpVisible: boolean;
  showHelp: () => void;
  hideHelp: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  helpVisible: false,
  showHelp: () => set({ helpVisible: true }),
  hideHelp: () => set({ helpVisible: false }),
}));
