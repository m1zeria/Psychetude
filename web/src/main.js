import { initScene } from './brain/scene.js';
import { loadBrain } from './brain/model.js';
import { attachElectrodes } from './brain/electrodes.js';
import { loadData } from './data/loader.js';
import { createEngine } from './audio/engine.js';
import { updateHUD } from './ui/hud.js';

async function boot() {
  const canvas = document.getElementById('scene');
  const { scene, camera, renderer, controls } = initScene(canvas);

  const brain = await loadBrain(scene);
  const data = await loadData();
  const engine = createEngine();

  attachElectrodes({
    brain,
    scene,
    camera,
    channels: data.meta.channels,
    onSelect: (channelIndex, channelName, frame) => {
      const frameData = data.frames[frame] ?? data.frames[0];
      const bands = frameData.bands;
      engine.play(channelIndex, channelName, bands);
      updateHUD(channelName, bands, data.meta.bands);
    },
  });

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('status').textContent = 'failed to load — see console';
});
