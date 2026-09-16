import * as Tone from 'tone';
import { bandPowerToSound } from './mapping.js';

export function createEngine() {
  const voices = new Map();
  let started = false;

  async function ensureStarted() {
    if (started) return;
    await Tone.start();
    started = true;
  }

  function getVoice(channelIndex) {
    if (voices.has(channelIndex)) return voices.get(channelIndex);

    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 6,
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.8 },
    }).toDestination();

    const voice = { synth };
    voices.set(channelIndex, voice);
    return voice;
  }

  async function play(channelIndex, channelName, bands) {
    await ensureStarted();
    const { synth } = getVoice(channelIndex);
    const { freq, duration } = bandPowerToSound(bands, channelIndex);
    synth.triggerAttackRelease(freq, duration);
  }

  return { play };
}
