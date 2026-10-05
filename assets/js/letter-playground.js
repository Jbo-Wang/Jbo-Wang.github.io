import * as THREE from 'three';
import * as CANNON from './vendor/cannon-es.js';
import { FontLoader } from './vendor/FontLoader.js';
import { createArmIK } from './robot-ik.js?v=8';
import { createGraspFrame } from './grasp-frame.js?v=8';
import { deferLetter, completeLetter, nextLetter } from './letter-retry.js';
import { createChiikawaToy, createFootball } from './playground-props.js?v=9';

export async function createLetterPlayground({ scene, camera, container, arms, wake, reducedMotion }) {
  const [font, chiikawa] = await Promise.all([
    new FontLoader().loadAsync(new URL('../models/so101/helvetiker_bold.typeface.json', import.meta.url).href),
    createChiikawaToy(),
  ]);
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, -9.81) });
  world.allowSleep = true;
  world.solver.iterations = 12;
  world.defaultContactMaterial.friction = 0.42;
  world.defaultContactMaterial.restitution = 0.04;
  const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  world.addBody(floor);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.024);
  const hitPoint = new THREE.Vector3();
  const hand = new THREE.Vector3();
  const target = new THREE.Vector3();
  const handRotation = new THREE.Quaternion();
  const graspPoint = new THREE.Vector3();
  const items = [];
  for (const arm of arms) arm.graspFrame = createGraspFrame(arm.model, arm.profile);
  const solvers = arms.map(createArmIK);
  const reachSolvers = arms.map(createArmIK);
  let drag = null;
  let job = null;
  const jobs = [null, null];
  let enabled = !reducedMotion.matches;
  let nextAction = Infinity;
  let nextAssignment = 0;
  let disposed = false;
  const hero = document.querySelector('.home-hero');
  const wordCenterY = -0.16;

  for (const [index, letter] of [...'JBO'].entries()) {
    const geometry = new THREE.ExtrudeGeometry(font.generateShapes(letter, 0.115), {
      depth: 0.018, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003,
      bevelSegments: 5, steps: 1, curveSegments: 12,
    });
    geometry.computeBoundingBox();
    const heightScale = 1.3;
    geometry.scale(heightScale, heightScale, 1);
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    const mesh = new THREE.Mesh(geometry, [
      new THREE.MeshStandardMaterial({ color: 0x7e8388, roughness: 0.38, metalness: 0.32 }),
      new THREE.MeshStandardMaterial({ color: 0xe4e6e8, roughness: 0.3, metalness: 0.22 }),
    ]);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 12),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false }),
    );
    outline.raycast = () => {};
    mesh.add(outline);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const home = new THREE.Vector3(0, 0.01, size.z / 2 + 0.001);
    const body = new CANNON.Body({ mass: 0.045, linearDamping: 0.55, angularDamping: 0.65,
      shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
      position: new CANNON.Vec3(home.x, home.y, home.z), sleepSpeedLimit: 0.035, sleepTimeLimit: 0.4 });
    world.addBody(body);
    body.angularFactor.set(0, 0, 1);
    const item = { letter, mesh, body, home, size, heightScale };
    mesh.userData.item = item;
    items.push(item);
  }
  const letters = items.slice();
  for (const prop of [
    { letter: 'Chiikawa', mesh: chiikawa, size: new THREE.Box3().setFromObject(chiikawa).getSize(new THREE.Vector3()), radius: 0 },
    { letter: 'Football', mesh: createFootball(), size: new THREE.Vector3(0.078, 0.078, 0.078), radius: 0.039 },
  ]) {
    const home = new THREE.Vector3(0, wordCenterY, prop.size.z / 2 + 0.001);
    const shape = prop.radius ? new CANNON.Sphere(prop.radius) :
      new CANNON.Box(new CANNON.Vec3(prop.size.x / 2, prop.size.y / 2, prop.size.z / 2));
    const body = new CANNON.Body({ mass: 0.045, linearDamping: 0.55, angularDamping: 0.65,
      shape, position: new CANNON.Vec3(home.x, home.y, home.z), sleepSpeedLimit: 0.035, sleepTimeLimit: 0.4 });
    body.angularFactor.set(0, 0, 1);
    world.addBody(body);
    const item = { ...prop, body, home, heightScale: 1, visualRotation: prop.mesh.quaternion.clone() };
    prop.mesh.userData.item = item;
    prop.mesh.position.copy(home);
    scene.add(prop.mesh);
    items.push(item);
  }
  const gaps = [0.024, 0.024, 0.03, 0.024];
  const rowWidth = items.reduce((sum, item) => sum + item.size.x, 0) + gaps.reduce((sum, gap) => sum + gap, 0);
  let cursor = -rowWidth / 2;
  for (const [index, item] of items.entries()) {
    item.home.x = cursor + item.size.x / 2;
    item.home.y = wordCenterY;
    item.body.position.copy(item.home);
    item.mesh.position.copy(item.home);
    cursor += item.size.x + (gaps[index] ?? 0);
  }
  const toy = items.find(item => item.letter === 'Chiikawa');
  const football = items.find(item => item.letter === 'Football');
  function propsOverlap(moving, position) {
    const ballPosition = moving === football ? position : football.body.position;
    const toyPosition = moving === toy ? position : toy.body.position;
    if (Math.abs(ballPosition.z - toyPosition.z) > toy.size.z / 2 + football.radius) return false;
    const angle = 2 * Math.atan2(toy.body.quaternion.z, toy.body.quaternion.w);
    const dx = ballPosition.x - toyPosition.x;
    const dy = ballPosition.y - toyPosition.y;
    const x = dx * Math.cos(angle) + dy * Math.sin(angle);
    const y = -dx * Math.sin(angle) + dy * Math.cos(angle);
    const edgeX = Math.max(Math.abs(x) - toy.size.x / 2, 0);
    const edgeY = Math.max(Math.abs(y) - toy.size.y / 2, 0);
    return edgeX * edgeX + edgeY * edgeY < (football.radius + 0.003) ** 2;
  }
  function constrainPropSweep(item, requested) {
    if (item !== toy && item !== football) return requested;
    const start = item.body.position;
    if (propsOverlap(item, start)) return requested;
    const distance = Math.hypot(requested.x - start.x, requested.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / 0.005));
    for (let step = 1; step <= steps; step++) {
      const fraction = step / steps;
      const position = new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, requested.x, fraction),
        THREE.MathUtils.lerp(start.y, requested.y, fraction), item.home.z,
      );
      if (propsOverlap(item, position)) {
        const safe = (step - 1) / steps;
        return new THREE.Vector3(
          THREE.MathUtils.lerp(start.x, requested.x, safe),
          THREE.MathUtils.lerp(start.y, requested.y, safe), item.home.z,
        );
      }
    }
    return requested;
  }

  const pusher = new CANNON.Body({ type: CANNON.Body.KINEMATIC, mass: 0, shape: new CANNON.Sphere(0.013), collisionFilterMask: 0 });
  world.addBody(pusher);
  const trailGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: 0xb79834, transparent: true, opacity: 0.28 }));
  trail.visible = false;
  scene.add(trail);

  function setRay(x, y) {
    const rect = container.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera);
  }
  function settle(item) {
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().copy(item.body.quaternion), 'XYZ');
    item.body.quaternion.setFromEuler(0, 0, rotation.z);
    item.body.type = CANNON.Body.DYNAMIC;
    item.body.collisionFilterMask = -1;
    item.body.updateMassProperties();
    item.body.velocity.setZero();
    item.body.angularVelocity.setZero();
    item.body.wakeUp();
  }
  function cancelJob() {
    for (const task of jobs) if (task?.held) settle(task.item);
    jobs.fill(null);
    job = null;
    pusher.collisionFilterMask = 0;
    trail.visible = false;
    for (const arm of arms) { Object.assign(arm.desired, arm.rest); arm.returningHome = true; }
  }
  function dirty(item) {
    return Math.hypot(item.body.position.x - item.home.x, item.body.position.y - item.home.y) > 0.009 ||
      Math.abs(item.body.quaternion.z) > 0.08 || Math.abs(item.body.quaternion.x) + Math.abs(item.body.quaternion.y) > 0.1;
  }
  function graspSpec(item) {
    // R5a fingertips extend about 18 mm past its calibrated TCP.
    if (item.letter === 'Chiikawa') return { point: new THREE.Vector3(0, 0, item.size.z / 2 + 0.018), width: 0.05 };
    if (item.letter === 'Football') return { point: new THREE.Vector3(), width: 0.064 };
    const stroke = {
      J: { x: item.size.x / 2 - 0.014 * item.heightScale, y: 0.018 * item.heightScale, width: 0.028 * item.heightScale },
      B: { x: -item.size.x / 2 + 0.015 * item.heightScale, y: 0, width: 0.030 * item.heightScale },
      O: { x: item.size.x / 2 - 0.014 * item.heightScale, y: 0, width: 0.028 * item.heightScale },
    }[item.letter];
    return {
      point: new THREE.Vector3(stroke.x, stroke.y, 0),
      width: stroke.width,
    };
  }
  function graspHeights(item) {
    if (item.letter !== 'Chiikawa') return { approach: 0.085, travel: 0.095 };
    const approach = item.home.z + item.size.z / 2 + 0.04;
    return { approach, travel: approach + 0.02 };
  }
  function gripperOpening(arm, width) {
    const profile = arm.profile;
    return THREE.MathUtils.clamp((width / arm.base.scale.x - profile.jawMinimum) / profile.jawTravel, 0, profile.jawMaximum);
  }
  function setGraspOffset(arm, width) {
    arm.graspFrame.position.x = arm.profile.graspOffset[0] + arm.profile.graspShiftX(width, arm.base.scale.x);
  }
  function gripperGap(arm) {
    const profile = arm.profile;
    return (profile.jawMinimum + profile.jawTravel * arm.current[profile.joints.gripper]) * arm.base.scale.x;
  }
  function setGripper(arm, value) {
    arm.desired[arm.profile.joints.gripper] = value;
    if (arm.profile.joints.otherJaw) arm.desired[arm.profile.joints.otherJaw] = (arm.profile.otherJawSign ?? -1) * value;
  }
  // Check the same open and closed tool frames used by the pickup and placement.
  function reachableArm(item, position, rotation = item.body.quaternion) {
    const spec = graspSpec(item);
    const heights = graspHeights(item);
    const q = new THREE.Quaternion().copy(rotation);
    const point = spec.point.clone().applyQuaternion(q).add(position);
    point.z = item.home.z + spec.point.z;
    const yaw = 2 * Math.atan2(q.z, q.w) + (item.letter === 'A' ? -0.3 : 0);
    const order = position.x < 0 ? [0, 1] : [1, 0];
    for (const index of order) {
      const arm = arms[index];
      const profile = arm.profile;
      const previous = arm.graspFrame.position.x;
      setGraspOffset(arm, spec.width);
      const solver = reachSolvers[index];
      solver(point, yaw);
      let valid = solver.reachable;
      if (valid) {
        solver(point.clone().setZ(heights.travel), yaw);
        valid = solver.reachable;
      }
      if (valid) {
        solver(spec.point.clone().add(item.home), item.letter === 'A' ? -0.3 : 0);
        valid = solver.reachable;
      }
      if (valid) {
        solver(spec.point.clone().add(item.home).setZ(heights.travel), item.letter === 'A' ? -0.3 : 0);
        valid = solver.reachable;
      }
      setGraspOffset(arm, spec.width + profile.jawClearance);
      if (valid) {
        solver(point, yaw);
        valid = solver.reachable;
      }
      if (valid) {
        solver(point.clone().setZ(heights.approach), yaw);
        valid = solver.reachable;
      }
      arm.graspFrame.position.x = previous;
      if (valid) return index;
    }
    return -1;
  }
  function constrainPlacement(item, requested) {
    const start = new THREE.Vector3().copy(item.body.position);
    if (reachableArm(item, requested) >= 0) return requested;
    let low = 0, high = 1;
    for (let iteration = 0; iteration < 7; iteration++) {
      const middle = (low + high) / 2;
      const candidate = start.clone().lerp(requested, middle);
      if (reachableArm(item, candidate) >= 0) low = middle;
      else high = middle;
    }
    return start.lerp(requested, low);
  }
  function startJob(item, push, now, index = item.body.position.x < 0 ? 0 : 1) {
    const arm = arms[index];
    arm.returningHome = false;
    if (arm.profile.id === 'piper-x' || arm.profile.id === 'r5a') solvers[index].setSeed(reachSolvers[index].getSeed());
    // Use solid strokes, avoiding the open centers of Y, A and F.
    const {point: grip, width: strokeWidth} = graspSpec(item);
    const heights = graspHeights(item);
    if (item.letter === 'Chiikawa') {
      heights.approach = Math.max(heights.approach, item.body.position.z + item.size.z / 2 + 0.04);
      heights.travel = heights.approach + 0.02;
    }
    setGraspOffset(arm, strokeWidth);
    arm.graspFrame.getWorldPosition(hand);
    job = { item, arm, index, push, grip, strokeWidth, heights, phase: 'approach', start: now, from: hand.clone(), held: false, offset: new THREE.Vector3(), relativeRotation: new THREE.Quaternion(), lastSolve: 0 };
    jobs[index] = job;
    setGripper(arm, push ? 0.05 : gripperOpening(arm, strokeWidth + arm.profile.jawClearance));
    trail.visible = true;
    const positions = trail.geometry.attributes.position;
    positions.setXYZ(0, item.body.position.x, item.body.position.y, 0.004);
    positions.setXYZ(1, item.home.x, item.home.y, 0.004);
    positions.needsUpdate = true;
  }
  function transition(phase, now) {
    job.phase = phase;
    job.start = now;
    job.arm.graspFrame.getWorldPosition(job.from);
  }
  document.addEventListener('pointerdown', event => {
    if (event.target.closest('a, button') || event.button !== 0) return;
    const rect = container.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    setRay(event.clientX, event.clientY);
    const hit = ray.intersectObjects(items.map(item => item.mesh), true)[0];
    if (!hit) return;
    event.preventDefault();
    cancelJob();
    let picked = hit.object;
    while (picked && !picked.userData.item) picked = picked.parent;
    const item = picked?.userData.item;
    if (!item) return;
    ray.ray.intersectPlane(plane, hitPoint);
    drag = { item, id: event.pointerId, offset: new THREE.Vector3(item.body.position.x, item.body.position.y, 0).sub(hitPoint) };
    item.body.type = CANNON.Body.KINEMATIC;
    item.body.updateMassProperties();
    item.body.wakeUp();
    item.body.velocity.setZero();
    item.body.angularVelocity.setZero();
    hero.setPointerCapture(event.pointerId);
    hero.classList.add('is-dragging');
    wake();
  });
  hero.addEventListener('pointermove', event => {
    setRay(event.clientX, event.clientY);
    if (!drag) {
      hero.classList.toggle('over-letter', ray.intersectObjects(items.map(item => item.mesh), true).length > 0);
      return;
    }
    if (event.pointerId !== drag.id || !ray.ray.intersectPlane(plane, hitPoint)) return;
    hitPoint.add(drag.offset);
    const allowed = constrainPlacement(drag.item, constrainPropSweep(drag.item, hitPoint));
    // Keep the dragged collider at table height so it can push the other props.
    drag.item.body.position.set(allowed.x, allowed.y, drag.item.home.z + 0.002);
    drag.item.body.aabbNeedsUpdate = true;
    for (const item of items) if (item !== drag.item) item.body.wakeUp();
    wake();
  });
  function release() {
    if (!drag) return;
    settle(drag.item);
    drag = null;
    hero.classList.remove('is-dragging');
    nextAction = performance.now() + 900;
    wake();
  }
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);
  hero.addEventListener('lostpointercapture', release);
  window.addEventListener('blur', () => { release(); cancelJob(); });
  reducedMotion.addEventListener('change', () => { enabled = !reducedMotion.matches; cancelJob(); wake(); });

  function update(now, dt) {
    if (disposed) return false;
    if (enabled && !reducedMotion.matches && !drag && now > nextAction && now > nextAssignment) {
      nextAssignment = now + 500;
      for (const [index, arm] of arms.entries()) {
        if (jobs[index]) continue;
        const candidates = items.filter(item => dirty(item) && Math.abs(item.body.position.z - item.home.z) < 0.012 && !jobs.some(task => task?.item === item) && reachableArm(item, new THREE.Vector3().copy(item.body.position)) === index)
          .sort((a, b) => Math.abs(a.body.position.x - arm.base.position.x) - Math.abs(b.body.position.x - arm.base.position.x));
        const misplaced = nextLetter(candidates, now, jobs.some(Boolean));
        if (misplaced) startJob(misplaced, false, now, index);
      }
      if (!jobs.some(Boolean) && !items.some(dirty)) nextAction = Infinity;
    }
    for (const task of jobs) {
      if (!task) continue;
      job = task;
      const { item, arm, phase, push } = job;
      const age = (now - job.start) / 1000;
      // Follow each profile's grasp center while the jaws close.
      const gap = gripperGap(arm);
      setGraspOffset(arm, job.held ? job.strokeWidth : gap);
      arm.graspFrame.getWorldPosition(hand);
      arm.graspFrame.getWorldQuaternion(handRotation);
      const pos = item.body.position;
      const itemRotation = new THREE.Quaternion().copy(item.body.quaternion);
      graspPoint.copy(job.grip).applyQuaternion(itemRotation).add(new THREE.Vector3(pos.x, pos.y, pos.z));
      let duration = 1;
      if (phase === 'approach') {
        target.set(push ? pos.x - item.size.x / 2 - 0.016 : graspPoint.x, push ? pos.y : graspPoint.y, item.letter === 'Chiikawa' ? Math.max(job.heights.approach, pos.z + item.size.z / 2 + 0.04) : job.heights.approach);
        duration = 1.15;
      } else if (phase === 'descend') {
        target.copy(graspPoint);
        if (push) target.set(pos.x - item.size.x / 2 - 0.016, pos.y, item.home.z + 0.005);
        duration = 0.8;
      } else if (phase === 'close') {
        target.copy(graspPoint);
        duration = 0.4;
      } else if (phase === 'push') {
        target.copy(job.pushEnd);
        duration = 0.85;
      } else if (phase === 'lift') {
        target.copy(job.from); target.z = job.heights.travel;
        duration = 0.7;
      } else if (phase === 'carry') {
        target.copy(item.home).add(job.grip); target.z = job.heights.travel;
        duration = 1.05;
      } else if (phase === 'place') {
        target.copy(item.home).add(job.grip);
        duration = 0.85;
      } else {
        target.copy(job.from); target.z = job.heights.travel;
        duration = 0.95;
      }
      duration *= arm.profile.phaseDurationScale ?? 1;
      const t = THREE.MathUtils.smoothstep(age / duration, 0, 1);
      const destination = target.clone();
      container.dataset.reach = JSON.stringify({phase, letter: item.letter, down: new THREE.Vector3(0, 0, 1).applyQuaternion(handRotation).z, hand: hand.toArray(), target: destination.toArray(), error: hand.distanceTo(destination)});
      target.lerpVectors(job.from, destination, t);
      if (now > job.lastSolve + 60) {
        const placing = ['carry', 'place', 'retreat'].includes(phase);
        const yaw = placing ? (job.placementYaw ?? 0) : 2 * Math.atan2(item.body.quaternion.z, item.body.quaternion.w) + (item.letter === 'A' ? -0.3 : 0);
        Object.assign(arm.desired, solvers[job.index](target, yaw));
        job.lastSolve = now;
      }
      if (job.held) {
        const attachment = job.offset.clone().applyQuaternion(handRotation).add(hand);
        item.body.position.copy(attachment);
        item.body.quaternion.copy(handRotation.clone().multiply(job.relativeRotation));
        item.body.aabbNeedsUpdate = true;
        for (const other of items) if (other !== item) other.body.wakeUp();
      }
      if (phase === 'push') {
        pusher.collisionFilterMask = -1;
        pusher.velocity.set((hand.x - pusher.position.x) / Math.max(dt, 0.001), (hand.y - pusher.position.y) / Math.max(dt, 0.001), (hand.z - pusher.position.z) / Math.max(dt, 0.001));
      } else {
        pusher.collisionFilterMask = 0;
        pusher.position.copy(hand);
        pusher.velocity.setZero();
      }
      const pointingDown = new THREE.Vector3(0, 0, 1).applyQuaternion(handRotation).z < -0.96;
      const contactError = hand.clone().sub(graspPoint).applyQuaternion(handRotation.clone().invert());
      const jawGap = gripperGap(arm);
      const tolerance = arm.profile.contactTolerance ?? [0.003, 0.005, 0.005];
      const contact = Math.abs(contactError.x) < tolerance[0] && Math.abs(contactError.y) < tolerance[1] &&
        Math.abs(contactError.z) < tolerance[2] && Math.abs(jawGap - job.strokeWidth) < 0.003 && pointingDown;
      container.dataset.grasp = JSON.stringify({side:arm.side, movingJawX:-new THREE.Vector3(1, 0, 0).applyQuaternion(handRotation).x, letter:item.letter, phase, contact, gap:jawGap, width:job.strokeWidth, error:contactError.toArray()});
      const positionTolerance = arm.profile.phasePositionTolerance?.[phase] ?? (phase === 'place' ? 0.005 : phase === 'descend' ? 0.003 : 0.018);
      if (age >= duration && hand.distanceTo(destination) < positionTolerance && (push || !['descend', 'close'].includes(phase) || pointingDown) && (phase !== 'close' || contact)) {
        if (phase === 'approach') transition('descend', now);
        else if (phase === 'descend' && push) {
          const displaced = constrainPlacement(item, new THREE.Vector3(pos.x + 0.035, pos.y + 0.012, pos.z));
          job.pushEnd = hand.clone().add(displaced.sub(new THREE.Vector3(pos.x, pos.y, pos.z)));
          transition('push', now);
        } else if (phase === 'descend') {
          setGripper(arm, gripperOpening(arm, job.strokeWidth));
          transition('close', now);
        } else if (phase === 'close') {
          container.dataset.lastGrasp = JSON.stringify({letter:item.letter, gap:jawGap, width:job.strokeWidth, error:contactError.toArray(), down:pointingDown});
          const inverseHand = handRotation.clone().invert();
          job.offset.set(pos.x - hand.x, pos.y - hand.y, pos.z - hand.z).applyQuaternion(inverseHand);
          job.relativeRotation.copy(inverseHand).multiply(itemRotation);
          const homePinch = new THREE.Vector3(1, 0, 0).applyQuaternion(job.relativeRotation.clone().invert());
          job.placementYaw = Math.atan2(homePinch.y, homePinch.x) - arm.profile.ikYawOffset(arm.side);
          job.held = true;
          item.body.type = CANNON.Body.KINEMATIC;
          item.body.updateMassProperties();
          item.body.wakeUp();
          item.body.collisionFilterMask = -1;
          item.body.velocity.setZero();
          item.body.angularVelocity.setZero();
          transition('lift', now);
        } else if (phase === 'lift') transition('carry', now);
        else if (phase === 'carry') transition('place', now);
        else if (phase === 'place') {
          job.held = false;
          settle(item);
          completeLetter(item, items);
          setGripper(arm, gripperOpening(arm, job.strokeWidth + arm.profile.jawClearance));
          transition('retreat', now);
        } else if (phase === 'push') transition('retreat', now);
        else {
          arm.returningHome = true;
          Object.assign(arm.desired, arm.rest);
          jobs[job.index] = null;
          job = null;
          if (!jobs.some(Boolean) && !items.some(dirty)) {
            nextAction = Infinity;
          } else nextAction = now;
        }
      } else if (age > duration + 4) {
        // Unreachable targets are released, never teleported into a fake successful grasp.
        if (job.held) settle(job.item);
        deferLetter(item, now);
        Object.assign(arm.desired, arm.rest);
        arm.returningHome = true;
        container.dataset.lastFailure = JSON.stringify({letter:item.letter, side:arm.side, phase, error:hand.distanceTo(destination), contactError:contactError.toArray(), jawGap, width:job.strokeWidth, pointingDown});
        jobs[job.index] = null;
        job = null;
        nextAction = now + 500;
      }
    }
    job = jobs.find(Boolean) || null;
    trail.visible = false;
    world.step(1 / 60, Math.min(dt, 0.05), 3);
    for (const item of items) {
      // Let gravity and contacts resolve sliding and small stacks naturally.
      if (item.body.type === CANNON.Body.DYNAMIC) {
        const quiet = item.body.velocity.lengthSquared() < 0.000004 && item.body.angularVelocity.lengthSquared() < 0.0004;
        item.quietTime = quiet ? (item.quietTime || 0) + dt : 0;
        if (item.quietTime > 0.4) item.body.sleep();
      }
      if (item.body.position.z < -0.15 || Math.abs(item.body.position.x) > 0.5 || Math.abs(item.body.position.y) > 0.45) {
        settle(item); item.body.position.copy(item.home); item.body.quaternion.set(0, 0, 0, 1);
      }
      item.mesh.position.copy(item.body.position);
      item.mesh.quaternion.copy(item.body.quaternion);
      if (item.visualRotation) item.mesh.quaternion.multiply(item.visualRotation);
    }
    container.dataset.activity = drag ? 'dragging' : jobs.map(task => task ? `${task.push ? 'push' : 'tidy'}-${task.phase}` : 'idle').join(',');
    container.dataset.letters = JSON.stringify(items.map(item => ({ letter: item.letter, x: +item.body.position.x.toFixed(3), y: +item.body.position.y.toFixed(3), z: +item.body.position.z.toFixed(3), settled: !dirty(item) })));
    return !!drag || !!job || items.some(item => item.body.sleepState !== CANNON.Body.SLEEPING);
  }
  document.body.classList.add('has-letter-playground');
  container.dataset.playground = 'ready';
  const homeBounds = new THREE.Box3();
  for (const item of items) homeBounds.union(new THREE.Box3().setFromObject(item.mesh));
  function setPalette(palette) {
    for (const { mesh } of letters) {
      mesh.material[0].color.set(palette.face);
      mesh.material[1].color.set(palette.side);
      for (const material of mesh.material) {
        material.metalness = palette.metalness;
        material.roughness = palette.roughness;
      }
      mesh.children[0].material.color.set(palette.edge);
    }
  }
  return { homeBounds, update, setPalette, armBusy(index) { return !!jobs[index]; }, nextWake() { return enabled && !reducedMotion.matches && Number.isFinite(nextAction) ? Math.max(nextAction, nextAssignment) : null; }, suspend() { release(); cancelJob(); }, dispose() { disposed = true; cancelJob(); } };
}
