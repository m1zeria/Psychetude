/**
 * pitch quantization helpers.
 *
 * separated from mapping.js so the quantization logic can be tested
 * in isolation and swapped without touching the mapping.
 */

export const A4_MIDI = 69;
export const A4_HZ = 440;

export function midiToFreq(midi) {
  if (!Number.isFinite(midi)) return 0;
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function freqToMidi(freq) {
  if (!Number.isFinite(freq) || freq <= 0) return 0;
  return A4_MIDI + 12 * Math.log2(freq / A4_HZ);
}

/**
 * quantize a continuous midi value to the nearest note in `scale`.
 * `scale` is an array of semitone offsets within an octave, e.g.
 * [0, 2, 4, 7, 9] for major pentatonic. if `scale` is null or
 * empty, snaps to the nearest chromatic semitone.
 */
export function quantizeMidi(midi, scale = null) {
  if (!Number.isFinite(midi)) return 60; // middle c as neutral default

  if (!scale || scale.length === 0) {
    return Math.round(midi);
  }

  const octave = Math.floor(midi / 12);
  let best = null;
  let bestDist = Infinity;

  // search the octave below, at, and above the target
  for (let oct = octave - 1; oct <= octave + 1; oct++) {
    for (const step of scale) {
      const candidate = oct * 12 + step;
      const dist = Math.abs(candidate - midi);
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
  }
  return best;
}

/** names for the major pentatonic scale (c d e g a). */
export const SCALE_MAJOR_PENTATONIC = [0, 2, 4, 7, 9];

/** chromatic (no scale constraint; snap to nearest semitone). */
export const SCALE_CHROMATIC = null;
