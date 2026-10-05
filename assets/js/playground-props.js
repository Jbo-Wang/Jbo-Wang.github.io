import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

export async function createChiikawaToy() {
  const url = new URL('../models/chiikawa/chiikawa.glb', import.meta.url).href;
  const { scene: model } = await new GLTFLoader().loadAsync(url);
  const toy = new THREE.Group();
  model.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.raycast = () => {};
  });
  const bounds = new THREE.Box3().setFromObject(model);
  const height = bounds.getSize(new THREE.Vector3()).y;
  model.scale.setScalar(0.19 / height);
  model.updateMatrixWorld(true);
  bounds.setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  toy.add(model);
  const hitArea = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  toy.add(hitArea);
  return toy;
}
export function createFootball() {
  const ball = new THREE.Group();
  const radius = 0.039;
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 0.78 });
  const black = new THREE.MeshStandardMaterial({ color: 0x252b31, roughness: 0.82, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), white);
  shell.castShadow = true;
  shell.receiveShadow = true;
  ball.add(shell);
  // Twelve pentagons at the vertices of an icosahedron give the ball a
  // recognizable football pattern without a downloaded texture or model.
  const vertices = new THREE.IcosahedronGeometry(1, 0).getAttribute('position');
  const seen = new Set();
  for (let i = 0; i < vertices.count; i++) {
    const normal = new THREE.Vector3().fromBufferAttribute(vertices, i).normalize();
    const key = normal.toArray().map(value => value.toFixed(4)).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.011, 5), black);
    patch.position.copy(normal).multiplyScalar(radius + 0.0002);
    patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    ball.add(patch);
  }
  return ball;
}

