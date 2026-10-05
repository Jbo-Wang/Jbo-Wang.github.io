import * as THREE from 'three';
import numeric from './vendor/numeric.js';
import { createGraspFrame } from './grasp-frame.js?v=8';
// Numeric's generated vector operations resolve its namespace globally.
globalThis.numeric = numeric;

// Solve on a separate URDF hierarchy so optimizer evaluations never flash onscreen.
export function createArmIK(arm) {
  const profile = arm.profile;
  const names = profile.ikJointNames;
  const base = new THREE.Group();
  const model = arm.model.clone();
  const visuals = [];
  model.traverse(object => { if (object.isMesh) visuals.push(object); });
  for (const visual of visuals) visual.removeFromParent();
  const graspFrame = createGraspFrame(model, profile);
  base.add(model);
  const tip = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  const orientation = new THREE.Quaternion();
  const forward = new THREE.Vector3();
  const pinch = new THREE.Vector3();
  let seed = profile.ikSeed(arm.side);
  const limits = names.map((name, i) => profile.ikJointLimits?.[i] ?? model.joints[name].limit);
  const solve = (target, yaw = 0) => {
    // Tool +X points from the moving jaw toward the fixed jaw.
    // Camera screen-right is world -X, so opposite wrists face inward.
    yaw += profile.ikYawOffset(arm.side);
    base.position.copy(arm.base.position);
    base.quaternion.copy(arm.base.quaternion);
    base.scale.copy(arm.base.scale);
    graspFrame.position.copy(arm.graspFrame.position);
    const cost = angles => {
      let penalty = 0;
      const pose = { ...profile.ikFixedPose };
      angles.forEach((value, i) => {
        const bounded = THREE.MathUtils.clamp(value, limits[i].lower + 0.02, limits[i].upper - 0.02);
        pose[names[i]] = bounded;
        penalty += (value - bounded) ** 2 * 10 + (bounded - seed[i]) ** 2 * 0.0000002;
      });
      model.setJointValues(pose);
      base.updateMatrixWorld(true);
      graspFrame.getWorldPosition(tip);
      model.links[profile.wristLink].getWorldPosition(wrist);
      graspFrame.getWorldQuaternion(orientation);
      forward.set(0, 0, 1).applyQuaternion(orientation);
      pinch.set(1, 0, 0).applyQuaternion(orientation);
      const alignment = pinch.x * Math.cos(yaw) + pinch.y * Math.sin(yaw);
      return tip.distanceToSquared(target) * 4 + penalty +
        (1 + forward.z) * 0.05 + (1 - alignment) * 0.006 +
        Math.max(0, 0.045 - wrist.z) ** 2 * 4;
    };
    const aligned = () => tip.distanceTo(target) < 0.002 && forward.z < -0.96 &&
      pinch.x * Math.cos(yaw) + pinch.y * Math.sin(yaw) > 0.96;
    let result = numeric.uncmin(cost, seed, 0.00000001, undefined, 90);
    cost(result.solution);
    if (!aligned()) {
      for (const alternativeSeed of profile.ikAlternativeSeeds(seed)) {
        const alternative = numeric.uncmin(cost, alternativeSeed, 0.00000001, undefined, 90);
        if (alternative.f < result.f) result = alternative;
        cost(result.solution);
        if (aligned()) break;
      }
    }
    if (result.solution.every(Number.isFinite)) seed = result.solution.map((v, i) => THREE.MathUtils.clamp(v, limits[i].lower + 0.02, limits[i].upper - 0.02));
    cost(seed);
    solve.reachable = tip.distanceTo(target) < 0.003 && forward.z < -0.96 &&
      pinch.x * Math.cos(yaw) + pinch.y * Math.sin(yaw) > 0.96;
    return Object.fromEntries(names.map((name, i) => [name, seed[i]]));
  };
  solve.getSeed = () => seed.slice();
  solve.setSeed = values => { seed = values.slice(); };
  return solve;
}
