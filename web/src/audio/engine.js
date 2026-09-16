import * as Tone from 'tone';
import { bandPowerToSound } from './mapping.js';

export function createEngine() {
  const synthPool = [];
  const maxSynths = 8;
  let currentSynthIdx = 0;
  let started = false;

  async function ensureStarted() {
    if (started) return;
    await Tone.start();
    started = true;
  }

  function initSynthPool() {
    // pre-allocate a fixed pool of synths to avoid unbounded DSP node creation
    for (let i = 0; i < maxSynths; i++) {
      const synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 6,
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.8 },
      }).toDestination();
      synthPool.push(synth);
    }
  }

  function getSynth() {
    // round-robin: reuse synths in order to avoid accumulating audio objects
    const synth = synthPool[currentSynthIdx];
    currentSynthIdx = (currentSynthIdx + 1) % maxSynths;
    return synth;
  }

  async function play(channelIndex, channelName, bands) {
    await ensureStarted();
    const synth = getSynth();
    const { freq, duration } = bandPowerToSound(bands, channelIndex);
    synth.triggerAttackRelease(freq, duration);
  }

  // lazy-init pool on first play call
  return {
    play: async (channelIndex, channelName, bands) => {
      if (synthPool.length === 0) initSynthPool();
      return play(channelIndex, channelName, bands);
    },
  };
}
