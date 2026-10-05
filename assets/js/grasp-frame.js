import * as THREE from 'three';
// Each profile supplies its own calibrated tool center relative to the URDF link.
export function createGraspFrame(model, profile) {
  const frame = new THREE.Object3D();
  frame.name = 'calibrated_grasp_center';
  frame.position.set(...profile.graspOffset);
  if (profile.graspQuaternion) frame.quaternion.set(...profile.graspQuaternion);
  model.links[profile.graspLink].add(frame);
  return frame;
}
