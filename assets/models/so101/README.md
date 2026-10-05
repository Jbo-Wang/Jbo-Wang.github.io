# SO-101 follower

Original URDF and STL meshes from TheRobotStudio/SO-ARM100, Apache-2.0.

Source: https://github.com/TheRobotStudio/SO-ARM100/tree/eecbe3e0a9ebb23e25ad7b2759b03884c6660903/Simulation/SO101

`so101_new_calib.urdf` is saved as `so101.urdf`. Mesh geometry, material colors,
and joint limits are unchanged. The homepage uses visual meshes only.
At runtime the base frame and wrist-roll origin are adapted to the LeHome USD.

LeHome scene reference:
https://github.com/lehome-official/lehome-challenge/blob/a805ad2f7ab52a4583066fc4ee5180459a7f9d15/source/lehome/lehome/tasks/bedroom/garment_bi_cfg_v2.py

Both fixed bases share a 180-degree heading at x = +/-0.43 m, y = -0.25 m.
Robot hierarchies use a uniform 1.40 scale; IK clones use the same transform.
Letters sit between the arms on the same screen-space horizontal line as the
base origins. Their world Y is derived from the base transforms, letter height
and camera elevation instead of a fixed offset.
The camera uses an adapted top-down orthographic view. The transparent canvas
shares the page surface visually and preserves shadows over page content.

The playground contains five extruded, beveled YI FAN meshes using the bundled
Helvetiker bold typeface. Cannon-es 0.20.0 supplies gravity and rigid-body
collisions (box approximations). The only playground interaction is dragging
letters; releasing them triggers tidying. No toolbar or autonomous nudges remain.
Reduced motion disables
autonomous actions; leaving the viewport suspends simulation.
Drag placement uses online IK feasibility checks and a boundary search rather
than a fixed rectangle, validating grasp, overhead clearance and the home target.
This is endpoint reachability, not
continuous collision-free path certification.

Both SO-101 arms independently claim letters in their home half of the workspace.
A staged approach, descend, close, lift, carry, place and retreat sequence uses
position and orientation IK via numeric 1.2.6 on cloned URDF hierarchies.
Five arm joints align the tool downward and the pinch axis with a solid letter
stroke. Left/right refer to the camera view: the right arm uses the opposite
pinch heading so both moving jaws face the center. The solver checks both
wrist-roll branches when its local solution is poor. Placement preserves the
corresponding hand-relative orientation.
The URDF dummy frame is on the fixed finger inner face; a calibrated
frame offsets it to the center of the measured stroke. Stroke widths and grasp
locations are checked against the extruded mesh, including the narrow F stem.
Grasping requires position alignment within 3 mm before closing, then checks
the jaw gap against stroke width and the stroke position inside the jaw region
before attaching. Orientation must be within 17 degrees of downward.
A rigid hand-relative transform
keeps the letter attached while the wrist rotates. Each arm stays in its
working pose between jobs. After all letters are settled, they fold back.
There is no separate T asset.

Rendering uses a bounded transparent canvas (460 px desktop, 340 px mobile)
with shadows extending over nearby content. Pixel ratio is capped at 1.5.
Settled bodies sleep and rendering stops when joints stop moving. Visibility
changes suspend work. IK copies contain joint hierarchies without visual meshes.
Losslessly gzipped STL copies reduce the mesh payload from 16.1 MB to 6.1 MB.
The loader shares decoded geometry for repeated parts and falls back to original
STLs when browser decompression is unavailable. Materials are shared by color.

This is an interactive visual prototype, not a robotics policy or a complete
collision-free motion planner. Grasping uses a kinematic attachment at the hand;
robot links do not have physics colliders. Tool orientation is a weighted IK
objective with an acceptance gate at grasp, not a hard physical constraint.
Unreachable actions time out rather than teleporting letters.

Runtime: Three.js 0.169.0 (MIT), urdf-loader 0.12.6 (Apache-2.0),
cannon-es 0.20.0 (MIT), numeric 1.2.6 (MIT). Licenses are bundled in
assets/js/vendor and this model directory.
