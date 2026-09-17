import * as THREE from 'three';

// canonical 10-20 positions in unit-sphere space.
// approximated by hand; projection onto a real mesh is future work.
const TEN_TWENTY = {
  Fp1: [-0.25,  0.55, 0.75], Fp2: [ 0.25,  0.55, 0.75],
  F7:  [-0.65,  0.25, 0.55], F3:  [-0.30,  0.35, 0.80],
  Fz:  [ 0.00,  0.40, 0.90], F4:  [ 0.30,  0.35, 0.80],
  F8:  [ 0.65,  0.25, 0.55],
  T3:  [-0.90,  0.00, 0.10], C3:  [-0.35,  0.05, 0.90],
  Cz:  [ 0.00,  0.10, 1.00], C4:  [ 0.35,  0.05, 0.90],
  T4:  [ 0.90,  0.00, 0.10],
  T5:  [-0.70, -0.35, 0.20], P3:  [-0.30, -0.25, 0.85],
  Pz:  [ 0.00, -0.20, 0.95], P4:  [ 0.30, -0.25, 0.85],
  T6:  [ 0.70, -0.35, 0.20],
  O1:  [-0.25, -0.65, 0.60], O2:  [ 0.25, -0.65, 0.60],
};

// default position for unknown channels. distributed on a ring so
// they don't all stack at one point. deterministic by index.
function fallbackPosition(index, total) {
  const angle = (index / Math.max(1, total)) * Math.PI * 2;
  return [0.6 * Math.cos(angle), 0.4, 0.6 * Math.sin(angle)];
}

export function attachElectrodes({
  brain,
  scene,
  camera,
  channels,
  onSelect,
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const nodes = [];

  const group = new THREE.Group();
  brain.add(group);

  const knownCount = channels.filter((c) => TEN_TWENTY[c]).length;
  let unknownSeen = 0;

  channels.forEach((name, i) => {
    const pos = TEN_TWENTY[name] ?? fallbackPosition(unknownSeen++, knownCount + 1);

    const geo = new THREE.SphereGeometry(0.035, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7c5cff,
      emissive: 0x7c5cff,
      emissiveIntensity: 0.6,
    });
    const node = new THREE.Mesh(geo, mat);
    node.position.set(...pos);
    node.userData = { channelIndex: i, channelName: name };
    group.add(node);
    nodes.push(node);
  });

  const canvas = document.getElementById('scene');
  if (!canvas) return;

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  let lastClick = 0;
  canvas.addEventListener('pointerdown', () => {
    const now = performance.now();
    if (now - lastClick < 80) return; // debounce double-fire
    lastClick = now;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodes);
    if (hits.length === 0) return;

    const { channelIndex, channelName } = hits[0].object.userData;
    try {
      onSelect(channelIndex, channelName, 0);
    } catch (e) {
      console.warn('onSelect failed', e);
    }
  });
}
