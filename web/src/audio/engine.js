import * as Tone from 'tone';
import { bandPowerToChord } from './mapping.js';

export function createEngine() {
  const voices = new Map();
  let started = false;
  let available = true; // set false if tone fails to load
  let mode = 'aesthetic';

  async function ensureStarted() {
    if (started) return;
    try {
      await Tone.start();
      started = true;
    } catch (e) {
      console.warn('tone start failed — audio disabled', e);
      available = false;
    }
  }

  function getVoice(channelIndex) {
    if (voices.has(channelIndex)) return voices.get(channelIndex);

    const synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 6,
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.5,
        release: 0.8,
      },
    }).toDestination();

    const voice = { synth };
    voices.set(channelIndex, voice);
    return voice;
  }

  /**
   * play the five-voice chord for one electrode.
   * returns the chord that was played (or null if audio was
   * unavailable), so the caller can update the hud regardless.
   */
  async function play(channelIndex, channelName, bands) {
    const chord = bandPowerToChord(bands, channelIndex, mode);

    if (!available) return chord;

    await ensureStarted();
    if (!available) return chord;

    const { synth } = getVoice(channelIndex);

    for (const v of chord) {
      try {
        synth.triggerAttackRelease(v.freq, v.duration, undefined, v.gain);
      } catch (e) {
        console.warn('voice playback failed', e);
        // one voice failing does not stop the others
      }
    }
    return chord;
  }

  function setMode(next) {
    mode = next;
  }

  function getMode() {
    return mode;
  }

  function isAvailable() {
    return available;
  }

  return { play, setMode, getMode, isAvailable };
}
