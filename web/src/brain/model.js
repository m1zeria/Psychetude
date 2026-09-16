import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function loadBrain(scene) {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync('./models/brain.glb');
    const brain = gltf.scene;
    brain.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({
          color: 0xb8b0d8,
          roughness: 0.7,
          metalness: 0.05,
        });
      }
    });
    scene.add(brain);
    return brain;
  } catch (e) {
    console.warn('brain.glb missing — using sphere placeholder');
    const geo = new THREE.SphereGeometry(1, 64, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb8b0d8,
      roughness: 0.7,
    });
    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);
    return sphere;
  }
}
