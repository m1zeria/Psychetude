import * as Tone from 'tone';
import { bandPowerToChord } from './mapping.js';

export function createEngine() {
  const maxVoices = 8;
  const voices = [];
  let nextVoice = 0;
  let started = false;
  let available = true;
  let mode = 'aesthetic';

  async function ensureStarted() {
    if (started || !available) return;
    try {
      await Tone.start();
      started = true;
    } catch (e) {
      console.warn('tone start failed — audio disabled', e);
      available = false;
    }
  }

  function getVoice() {
    if (voices.length < maxVoices) {
      try {
        voices.push(new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2, modulationIndex: 6,
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.8 },
        }).toDestination());
      } catch (e) {
        console.warn('voice creation failed — audio disabled', e);
        available = false;
        return null;
      }
    }
    const voice = voices[nextVoice % voices.length];
    nextVoice = (nextVoice + 1) % maxVoices;
    return voice;
  }

  async function play(channelIndex, channelName, bands) {
    const chord = bandPowerToChord(bands, channelIndex, mode);
    await ensureStarted();
    if (!available) return chord;
    const synth = getVoice();
    if (!synth) return chord;
    for (const v of chord) {
      try { synth.triggerAttackRelease(v.freq, v.duration, undefined, v.gain); }
      catch (e) { console.warn('voice playback failed', e); }
    }
    return chord;
  }

  function dispose() {
    for (const synth of voices) synth.dispose();
    voices.length = 0;
    started = false;
  }

  return {
    play,
    setMode: (next) => { mode = next; },
    getMode: () => mode,
    isAvailable: () => available,
    dispose,
  };
}
