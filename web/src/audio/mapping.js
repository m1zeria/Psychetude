/**
 * Phase 3 — sonification mapping.
 *
 * DESIGN INTENT (fill in after reading sonification literature):
 *   - alpha power → pitch (log-frequency mapping)
 *   - beta power  → FM modulation index (brightness)
 *   - theta power → duration (temporal extent)
 *   - delta power → amplitude
 *   - gamma power → harmonicity (roughness / metallic quality)
 *
 * Log-frequency pitch mapping: given normalised power p ∈ [0,1],
 *   midi = midiMin + p * (midiMax - midiMin)
 *   freq = 440 * 2 ** ((midi - 69) / 12)
 *
 * Keeps pitch ratios perceptually uniform — the point of using log-frequency
 * mapping rather than linear Hz.
 */

const MIDI_MIN = 48;  // C3
const MIDI_MAX = 84;  // C6

function norm(value, lo, hi) {
  if (hi === lo) return 0.5;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

export function bandPowerToSound(bands, channelIndex = 0) {
  const pick = (b) => bands[b]?.[channelIndex] ?? 0;

  // Band power arrives as log10(mean PSD) from the pipeline.
  // Observed range roughly [-12, -7].
  const alpha = norm(pick('alpha'), -12, -7);
  const beta  = norm(pick('beta'),  -12, -7);
  const theta = norm(pick('theta'), -12, -7);

  const midi = MIDI_MIN + alpha * (MIDI_MAX - MIDI_MIN);
  const freq = 440 * Math.pow(2, (midi - 69) / 12);

  return {
    freq,
    duration: 0.4 + theta * 1.2,
    brightness: beta,       // reserved for FM index later
  };
}
