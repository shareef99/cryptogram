/**
 * Generate the game's sound effects as small WAV files (synthesized, so there
 * are no download/licensing concerns). Soft sine tones with quick envelopes.
 *
 * Run:  npx tsx scripts/make-sounds.ts   -> assets/sounds/*.wav
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../assets/sounds');
const RATE = 44100;

type Note = { freq: number; dur: number; gain?: number };

/** Render notes (played in sequence) to a Float array in [-1, 1]. */
function render(notes: Note[]): number[] {
  const samples: number[] = [];
  for (const n of notes) {
    const len = Math.floor(RATE * n.dur);
    const gain = n.gain ?? 0.38;
    for (let i = 0; i < len; i++) {
      const t = i / RATE;
      // Fast attack, exponential decay — a soft "pluck" envelope.
      const env = Math.min(1, t / 0.006) * Math.exp(-t / (n.dur * 0.45));
      const w =
        Math.sin(2 * Math.PI * n.freq * t) +
        0.3 * Math.sin(2 * Math.PI * n.freq * 2 * t); // a little 2nd harmonic
      samples.push((w / 1.3) * env * gain);
    }
  }
  return samples;
}

/** Encode mono float samples to a 16-bit PCM WAV buffer. */
function toWav(samples: number[]): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits/sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const N = (freq: number, dur: number, gain?: number): Note => ({ freq, dur, gain });

// Notes (Hz): E5 659, G5 784, A5 880, B5 988, C6 1047, E6 1319, G6 1568
const SOUNDS: Record<string, Note[]> = {
  correct: [N(784, 0.09), N(1047, 0.12)], // rising two-note "bling"
  wrong: [N(196, 0.13, 0.32), N(165, 0.16, 0.3)], // low descending "uh-uh"
  win: [N(659, 0.1), N(784, 0.1), N(988, 0.1), N(1319, 0.34)], // triumphant arpeggio
  coin: [N(988, 0.05, 0.34), N(1319, 0.13, 0.34)], // bright blip
  reveal: [N(1175, 0.05, 0.3), N(1568, 0.11, 0.3)], // soft sparkle
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  const file = resolve(OUT_DIR, `${name}.wav`);
  writeFileSync(file, toWav(render(notes)));
  console.log(`  ✓ ${name}.wav`);
}
console.log(`\n✅ Wrote ${Object.keys(SOUNDS).length} sounds -> ${OUT_DIR}\n`);
