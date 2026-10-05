// ARX R5a geometry. Browser pose and TCP calibration are local preview values.
export const r5a = {
  id: 'r5a',
  modelURL: new URL('../models/r5a/r5a.urdf', import.meta.url).href,
  modelRotationZ: 0,
  modelPosition: [0, 0, 0],
  // Turn the right arm so both zero-pose grippers point up the page.
  baseRotationZ: Math.PI / 2,
  baseScale: 0.94,
  basePosition: [0.44, -0.36, 0],
  jointNames: ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6', 'joint7', 'joint8'],
  ikJointNames: ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'],
  // The upstream URDF uses +/-10 rad placeholders; keep the browser solver in the forward workspace.
  ikJointLimits: [{ lower: -1.6, upper: 1.6 }, ...Array.from({ length: 5 }, () => ({ lower: -Math.PI, upper: Math.PI }))],
  joints: { pan: 'joint1', shoulder: 'joint2', elbow: 'joint3', wristPitch: 'joint4', wristRoll: 'joint6', gripper: 'joint7', otherJaw: 'joint8' },
  // URDF zero configuration for the six arm joints; open jaws only for display.
  readyPose: [0, 0, 0, 0, 0, 0, 0.02, 0.02],
  trackingPose: { joint2: 1.3, joint3: -1.6, joint4: 0.4 },
  uprightPose: { joint2: 0.5, joint3: -1.1, joint4: 0.8 },
  graspLink: 'link6',
  wristLink: 'link5',
  graspOffset: [0.14, 0, 0],
  // Local +Z points along the fingers (+X in the URDF); local +X spans the jaws (+Y).
  graspQuaternion: [0.5, 0.5, 0.5, 0.5],
  jawMinimum: 0,
  jawTravel: 2,
  jawMaximum: 0.044,
  otherJawSign: 1,
  jawClearance: 0.012,
  // Keep the six-joint arm brisk while contact and IK convergence control each phase.
  motionResponse: 9.5,
  phaseDurationScale: 0.8,
  homeAcceleration: 2,
  homeSpeedLimit: 1.2,
  contactTolerance: [0.005, 0.007, 0.007],
  phasePositionTolerance: { descend: 0.007, place: 0.008 },
  graspShiftX: () => 0,
  ikFixedPose: { joint7: 0.02, joint8: 0.02 },
  ikSeed: () => [0.9, 1.8, 1.5, -1.4, 0, -2.2],
  ikYawOffset: () => 0,
  ikAlternativeSeeds: () => [
    [0.5, 1.4, 1, -1, 0, -2.6],
    [1, 1.9, 1.7, -1.5, 0, -2.2],
    [1.2, 2.3, 2, -1.2, 0, -2.1],
  ],
};
