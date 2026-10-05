# Piper X + ARX R5a Playground

Open `index.html#playground` through a local HTTP server. The left arm uses the [AgileX Piper X description](https://github.com/agilexrobotics/piper_isaac_sim/tree/master/piper_x_description); the right arm uses the single-arm [ARX R5a URDF and STL meshes](https://github.com/ARXroboticsX/ARX_Model/tree/master/R5/R5a). The interaction pipeline was adapted from [`sudo-yf/wui-homepage`](https://github.com/sudo-yf/wui-homepage).

## Modules

- `robot-companion.js` loads both URDFs, renders the scene and interpolates joint values.
- `piper-x-profile.js` and `r5a-profile.js` contain model paths, transforms, joint mapping, rest pose, jaw mapping, TCP frame and IK seeds. The old `so101-profile.js` and mesh are retained locally for comparison.
- `robot-ik.js` solves six arm joints per robot against TCP position, downward approach direction and pinch-axis yaw using the URDF hierarchy and `numeric.uncmin`.
- `grasp-frame.js` attaches the profile-specific TCP to the URDF grasp link. R5a rotates this frame so its finger direction is the solver's tool axis.
- `letter-playground.js` handles JBO, the Chiikawa toy and football with Cannon physics, pointer raycasts, reachability checks and the approach → descend → grasp → lift → carry → place → retreat state machine.
- `playground-props.js` builds the two small procedural 3D props. The toy lies face-up for the overhead camera; the football uses black pentagon patches. They are preview models that can later be replaced with supplied meshes.

Objects move only after pointer-down and dragging. The earlier pointer-proximity impulse was removed. The toy's local face-up rotation is preserved when its rendered pose follows the Cannon body.

The ARX R5a URDF describes six revolute arm joints and two prismatic jaw joints. The source URDF has ±10 rad placeholders for the arm limits, so `r5a-profile.js` limits browser IK to ±π; these are preview bounds, not verified hardware limits. Its TCP offset and jaw gap mapping are visual/kinematic calibrations for the current letters and should be rechecked when new objects are added.

The Piper X left arm starts with `joint1`–`joint6` at zero, matching the authored `state:angular:physics:position = 0` values in the official [`piper_x_v1.usd`](https://github.com/agilexrobotics/piper_isaac_sim/blob/master/USD/piper_x_v1.usd). The playground keeps its two finger joints open at ±0.035 m to show the gripper clearly; the official USD initializes those at zero too. The numerical IK seed is separate from the displayed rest pose.

The R5a right arm also starts with its six arm joints at URDF zero. Its mounting group is rotated 180° around Z to put the base on the right and point its jaws left toward Piper. The two jaw joints stay open at 0.02 m for display. The earlier nonzero folded `readyPose` was a preview pose, not a value supplied by the R5a URDF.

## Current verification

The scene loaded with `data-playground=ready` and the models faced each other. A right-arm failure was reproduced at `descend`: the TCP was 3.26 mm from its target while the old phase gate required less than 3 mm. R5a now has its own 7 mm descend and 8 mm place gates, plus slightly wider calibrated contact tolerance; the IK, jaw-gap, downward-orientation and attachment checks remain in place. R5a also has quicker phase timing and joint response, with a bounded return-home velocity and acceleration. Its meshes use distinct neutral link finishes and the scene lighting instead of a single palette color with white outline edges. After these changes, dragging O into the right workspace completed a grasp and return with no failure record. Earlier Piper X checks covered J and B. This is a local preview; collision-free planning and precise contact calibration are not yet established.
