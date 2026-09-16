import { initScene } from './brain/scene.js';
import { loadBrain } from './brain/model.js';
import { attachElectrodes } from './brain/electrodes.js';
import { loadData, getFrame } from './data/loader.js';
import { createEngine } from './audio/engine.js';
import { updateHUD } from './ui/hud.js';

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`attempt ${i + 1} failed, retrying in ${delay}ms:`, err.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

function setStatus(msg, isError = false) {
  const el = document.getElementById('status');
  if (el) {
    el.textContent = msg;
    el.style.color = isError ? '#ff6b6b' : '#888';
  }
}

async function boot() {
  try {
    setStatus('initializing scene...');
    const canvas = document.getElementById('scene');
    const { scene, camera, renderer, controls } = initScene(canvas);

    setStatus('loading brain model...');
    const brain = await retryWithBackoff(() => loadBrain(scene));

    setStatus('loading eeg data...');
    const data = await retryWithBackoff(() => loadData());

    setStatus('starting audio engine...');
    const engine = createEngine();

    attachElectrodes({
      brain,
      scene,
      camera,
      channels: data.meta.channels,
      onSelect: async (channelIndex, channelName, frame) => {
        try {
          // lazy-load frame data on demand
          const frameData = await getFrame(frame);
          if (!frameData) {
            console.warn(`frame ${frame} not found`);
            return;
          }
          const bands = frameData.bands;
          engine.play(channelIndex, channelName, bands);
          updateHUD(channelName, bands, data.meta.bands);
        } catch (e) {
          console.error('failed to play frame:', e);
          setStatus('playback failed — check console', true);
        }
      },
    });

    setStatus('ready');

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  } catch (e) {
    console.error(e);
    setStatus(`failed to load — ${e.message}`, true);
  }
}

boot();
