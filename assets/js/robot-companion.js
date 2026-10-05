import * as THREE from 'three';
import { createLetterPlayground } from './letter-playground.js?v=100';
import { mountPalettePicker } from './scene-palettes.js?v=47';
import URDFLoader from './vendor/urdf-loader.js';
import { STLLoader } from './vendor/stl-loader.js';
import { ColladaLoader } from './vendor/ColladaLoader.js';
import { piperX } from './piper-x-profile.js?v=6';
import { r5a } from './r5a-profile.js?v=16';

const host = document.querySelector('.robot-companion');
if (host) mountRobot(host).catch((error) => {
  host.dataset.playground = 'error';
  host.insertAdjacentHTML('beforeend', '<p class="robot-load-error">Robot playground could not load. Please refresh the page.</p>');
  console.warn('Robot playground unavailable:', error.message);
});

async function mountRobot(container) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  // Frame the parallel Piper X and R5a arms around the playground row.
  const camera = new THREE.OrthographicCamera(-1, 1, 0.3, -0.3, 0.01, 10);
  camera.position.set(0, -0.45, 1.15);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, -0.18, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8c8c, 0.9));
  const light = new THREE.PointLight(0xffffff, 7, 0, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { near: 0.05, far: 12 });
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.001;
  light.shadow.radius = 9;
  light.position.set(-0.3, 0.2, 1.3);
  scene.add(light);
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.12, color: 0x000000 });
  // Fade the receiver near the viewport edge instead of cutting a shadow off abruptly.
  shadowMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 viewportSize;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\nvec2 edge = min(gl_FragCoord.xy, viewportSize - gl_FragCoord.xy);\ngl_FragColor.a *= smoothstep(0.0, 32.0, min(edge.x, edge.y));');
    shader.uniforms.viewportSize = { value: new THREE.Vector2() };
    shadowMaterial.userData.shader = shader;
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), shadowMaterial);
  ground.position.z = -0.006;
  ground.receiveShadow = true;
  scene.add(ground);

  const manager = new THREE.LoadingManager();
  const loader = new URDFLoader(manager);
  loader.parseCollision = false;
  const meshes = new Map();
  const stl = new STLLoader();
  const collada = new ColladaLoader();
  // Both arms fetch `url + '.gz'` first and decompress in the browser; the
  // raw file remains the fallback so models keep loading without it.
  const loadMesh = (url, loadingManager, done) => {
    loadingManager.itemStart(url);
    if (!meshes.has(url)) meshes.set(url, fetch(url + '.gz')
      .then(response => {
        if (!response.ok) throw new Error('Compressed mesh unavailable');
        return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      })
      .catch(() => fetch(url).then(response => {
        if (!response.ok) throw new Error('Mesh unavailable');
        return response.arrayBuffer();
      }))
      .then(data => /\.dae$/i.test(url)
        ? collada.parse(new TextDecoder().decode(data), '').scene
        : new THREE.Mesh(stl.parse(data))));
    meshes.get(url).then(object => done(object))
      .catch(error => { done(null, error); loadingManager.itemError(url); })
      .finally(() => loadingManager.itemEnd(url));
  };
  if ('DecompressionStream' in window) loader.loadMeshCb = loadMesh;
  const modelURL = r5a.modelURL;
  let robot;
  await new Promise((resolve, reject) => {
    manager.onLoad = resolve;
    manager.onError = (url) => reject(new Error(`Could not load ${url}`));
    loader.load(modelURL, (model) => { robot = model; }, undefined, reject);
  });
  if (!robot) throw new Error('R5a model is missing');
  meshes.clear();
  const piperManager = new THREE.LoadingManager();
  const piperLoader = new URDFLoader(piperManager);
  piperLoader.parseCollision = false;
  if ('DecompressionStream' in window) piperLoader.loadMeshCb = loadMesh;
  let piperRobot;
  await new Promise((resolve, reject) => {
    piperManager.onLoad = resolve;
    piperManager.onError = url => reject(new Error(`Could not load ${url}`));
    piperLoader.load(piperX.modelURL, model => { piperRobot = model; }, undefined, reject);
  });
  if (!piperRobot) throw new Error('Piper X model is missing');
  // Distinct, neutral link finishes let the R5a share the Piper's lighting.
  const linkFinishes = {
    base_link: 0x636b71, link1: 0x30363b, link2: 0x79838c,
    link3: 0x636b71, link4: 0x79838c, link5: 0x505960,
    link6: 0x636b71, link7: 0x292f34, link8: 0x292f34,
  };
  const materials = new Map();
  robot.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      const original = object.material;
      let link = object.parent;
      while (link && !(link.name in linkFinishes)) link = link.parent;
      const key = link?.name ?? 'base_link';
      if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
        color: linkFinishes[key],
        roughness: 0.58, metalness: 0.24,
      }));
      object.material = materials.get(key);
      original.dispose();
    }
  });
  robot.rotation.z = r5a.modelRotationZ;
  robot.position.set(...r5a.modelPosition);
  piperRobot.rotation.z = piperX.modelRotationZ;
  piperRobot.position.set(...piperX.modelPosition);
  piperRobot.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  const layouts = [
    { model: piperRobot, profile: piperX, side: 'left', rotation: piperX.baseRotationZ, scale: piperX.baseScale, position: piperX.basePosition, pose: piperX.readyPose },
    { model: robot, profile: r5a, side: 'right', rotation: r5a.baseRotationZ, scale: r5a.baseScale, position: r5a.basePosition, pose: r5a.readyPose },
  ];
  const arms = layouts.map(({ model, profile, side, rotation, scale, position, pose: values }) => {
    const base = new THREE.Group();
    base.rotation.z = rotation;
    base.scale.setScalar(scale);
    base.position.set(...position);
    base.add(model);
    scene.add(base);
    const pose = Object.fromEntries(profile.jointNames.map((name, joint) => [name, values[joint]]));
    model.setJointValues(pose);
    return { model, profile, base, side, rest: pose, current: { ...pose }, desired: { ...pose }, returningHome: false, homeVelocity: Object.fromEntries(profile.jointNames.map(name => [name, 0])) };
  });
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const framing = new THREE.Box3();
  const corner = new THREE.Vector3();
  for (const arm of arms) for (const pose of [{}, arm.profile.trackingPose, arm.profile.uprightPose]) {
    arm.model.setJointValues({ ...arm.rest, ...pose });
    scene.updateMatrixWorld(true);
    arm.model.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          corner.set(x, y, z).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          framing.expandByPoint(corner);
        }
      }
    }
    });
  }
  for (const arm of arms) arm.model.setJointValues(arm.rest);
  scene.updateMatrixWorld(true);
  const frameCenter = framing.getCenter(new THREE.Vector3());
  const frameSize = framing.getSize(new THREE.Vector3());
  camera.translateX(frameCenter.x);
  camera.translateY(frameCenter.y);
  const cameraCenter = camera.position.clone();
  const cameraOrientation = camera.quaternion.clone();
  const hero = document.querySelector('.home-hero');
  const avatar = document.querySelector('.profile-avatar');
  const lightRay = new THREE.Raycaster();
  let lightPointer = null;
  function updateLight() {
    if (!avatar) return;
    const rect = avatar.getBoundingClientRect();
    const viewport = container.getBoundingClientRect();
    const x = lightPointer?.x ?? rect.left + rect.width / 2;
    const y = lightPointer?.y ?? rect.top + rect.height / 2;
    lightRay.setFromCamera(new THREE.Vector2(
      ((x - viewport.left) / viewport.width) * 2 - 1,
      1 - ((y - viewport.top) / viewport.height) * 2,
    ), camera);
    // Keep the elevated light directly under the pointer in screen space.
    const distance = (1.5 - lightRay.ray.origin.z) / lightRay.ray.direction.z;
    light.position.copy(lightRay.ray.origin).addScaledVector(lightRay.ray.direction, distance);
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let playground;
  let activeUntil = 0;
  let idleWake = 0;
  const armSways = arms.map(() => ({ angle: 0, velocity: 0 }));
  let lastEdge = -Infinity;
  let edgeStrength = 0;
  let lastWheelTime = 0;
  function swingAtEdge(direction, speed) {
    const now = performance.now();
    if (reducedMotion.matches || !visible || hero.classList.contains('is-dragging')) return;
    const strength = 0.08 + 0.72 * Math.sqrt(Math.min(speed / 3000, 1));
    let impulse = strength;
    if (now - lastEdge < 850) {
      if (strength <= edgeStrength) return;
      impulse = strength - edgeStrength;
    } else {
      lastEdge = now;
    }
    edgeStrength = strength;
    armSways.forEach((sway, index) => {
      if (!playground?.armBusy(index)) sway.velocity += direction * impulse * (index === 0 ? 1 : 0.78);
    });
    wake();
  }
  function animate(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const motionDt = Math.min((now - lastTime) / 1000 || 1 / 60, 1);
    const dt = Math.min(motionDt, 0.05);
    lastTime = now;
    let jointsMoving = false;
    for (const arm of arms) {
      let homeReached = true;
      for (const name of Object.keys(arm.current)) {
        const difference = arm.desired[name] - arm.current[name];
        if (Math.abs(difference) > 0.0005) jointsMoving = true;
        if (arm.returningHome) {
          const acceleration = arm.profile.homeAcceleration ?? 1.2;
          const speedLimit = arm.profile.homeSpeedLimit ?? 0.8;
          const targetSpeed = Math.sign(difference) * Math.min(speedLimit, Math.sqrt(2 * acceleration * Math.abs(difference)));
          const speed = THREE.MathUtils.clamp(targetSpeed, arm.homeVelocity[name] - acceleration * motionDt, arm.homeVelocity[name] + acceleration * motionDt);
          arm.homeVelocity[name] = speed;
          if (Math.sign(speed) === Math.sign(difference)) arm.current[name] += Math.sign(difference) * Math.min(Math.abs(difference), Math.abs(speed) * motionDt);
        } else {
          arm.homeVelocity[name] = 0;
          arm.current[name] += difference * (1 - Math.exp(-(arm.profile.motionResponse ?? 7) * motionDt));
        }
        if (Math.abs(arm.rest[name] - arm.current[name]) > 0.001) homeReached = false;
      }
      if (arm.returningHome && homeReached) arm.returningHome = false;
      arm.model.setJointValues(arm.current);
    }
    scene.updateMatrixWorld(true);
    const moving = playground?.update(now, dt);
    // Bend only upper joints; fixed bases and the camera never move.
    armSways.forEach((sway, index) => {
      const step = Math.min(dt, 1 / 30);
      sway.velocity += (-(index === 0 ? 80 : 95) * sway.angle - 9 * sway.velocity) * step;
      sway.angle = THREE.MathUtils.clamp(sway.angle + sway.velocity * step, -0.065, 0.065);
      if (reducedMotion.matches || playground?.armBusy(index) || Math.abs(sway.angle) + Math.abs(sway.velocity) < 0.0004) sway.angle = sway.velocity = 0;
      const arm = arms[index];
      const joints = arm.profile.joints;
      arm.model.setJointValues({ [joints.shoulder]: arm.current[joints.shoulder] + sway.angle, [joints.elbow]: arm.current[joints.elbow] - sway.angle * 0.65, [joints.wristPitch]: arm.current[joints.wristPitch] + sway.angle * 0.3 });
    });
    if (shadowMaterial.userData.shader) renderer.getDrawingBufferSize(shadowMaterial.userData.shader.uniforms.viewportSize.value);
    renderer.render(scene, camera);
    for (const arm of arms) arm.model.setJointValues(arm.current);
    scene.updateMatrixWorld(true);
    container.dataset.renderCount = String(renderer.info.render.frame);
    if (moving || jointsMoving || armSways.some(sway => sway.angle !== 0 || sway.velocity !== 0) || now < activeUntil) frame = requestAnimationFrame(animate);
    else if (playground?.nextWake() !== null) {
      idleWake = setTimeout(wake, Math.max(100, playground.nextWake() - performance.now()));
    }
  }
  function wake() {
    clearTimeout(idleWake);
    activeUntil = performance.now() + 500;
    if (!frame && visible && !document.hidden) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale = Math.min((width - 32) / (frameSize.x * 1.08), (height - 32) / (frameSize.y * 1.08));
    camera.quaternion.copy(cameraOrientation);
    camera.position.copy(cameraCenter);
    camera.top = height / (2 * scale);
    camera.bottom = -camera.top;
    camera.right = width / (2 * scale);
    camera.left = -camera.right;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    updateLight();
    renderer.setSize(width, height, false);
    wake();
  }
  playground = await createLetterPlayground({ scene, camera, container, arms, wake, reducedMotion });
  mountPalettePicker(palette => {
    playground.setPalette(palette);
    document.body.style.setProperty('--accent', palette.accent);
    document.body.dataset.palette = palette.id;
    wake();
  });
  resize();
  new ResizeObserver(resize).observe(container);
  new ResizeObserver(resize).observe(hero);
  window.addEventListener('scroll', resize, { passive: true });
  function followPointer(event) {
    lightPointer = { x: event.clientX, y: event.clientY };
    updateLight();
    wake();
  }
  document.addEventListener('pointermove', followPointer, { passive: true });
  document.addEventListener('pointerdown', followPointer, { passive: true });
  const content = document.querySelector('.homepage-content');
  const scrollOffsets = new WeakMap();
  for (const element of [content, document.scrollingElement]) scrollOffsets.set(element, { top: element.scrollTop, time: performance.now() });
  document.addEventListener('scroll', event => {
    const element = event.target === document ? document.scrollingElement : event.target;
    if (element !== content && element !== document.scrollingElement) return;
    const now = performance.now();
    const previous = scrollOffsets.get(element) ?? { top: element.scrollTop, time: now };
    const delta = element.scrollTop - previous.top;
    const speed = Math.abs(delta) / THREE.MathUtils.clamp((now - previous.time) / 1000, 0.016, 0.12);
    scrollOffsets.set(element, { top: element.scrollTop, time: now });
    const end = element.scrollHeight - element.clientHeight;
    if (end <= 1) return;
    if (delta < 0 && element.scrollTop <= 1) swingAtEdge(-1, speed);
    if (delta > 0 && element.scrollTop >= end - 1) swingAtEdge(1, speed);
  }, { capture: true, passive: true });
  document.addEventListener('wheel', event => {
    const now = performance.now();
    const elapsed = THREE.MathUtils.clamp((now - lastWheelTime) / 1000, 0.016, 0.12);
    lastWheelTime = now;
    const element = matchMedia('(min-width: 761px)').matches ? content : document.scrollingElement;
    const pixels = Math.abs(event.deltaY) * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? element.clientHeight : 1);
    const speed = pixels / elapsed;
    const end = element.scrollHeight - element.clientHeight;
    if (end <= 1) return;
    if (event.deltaY < 0 && element.scrollTop <= 1) swingAtEdge(-1, speed);
    if (event.deltaY > 0 && element.scrollTop >= end - 1) swingAtEdge(1, speed);
  }, { passive: true });
  document.querySelector('.homepage-content').addEventListener('scroll', () => { updateLight(); wake(); }, { passive: true });
  if (avatar) new ResizeObserver(() => { updateLight(); wake(); }).observe(avatar);
  document.fonts.ready.then(() => { updateLight(); wake(); });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else { clearTimeout(idleWake); playground.suspend(); cancelAnimationFrame(frame); frame = 0; }
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(idleWake); playground.suspend(); cancelAnimationFrame(frame); frame = 0; }
    else wake();
  });
  // The host page reports viewport visibility; an iframe's own
  // IntersectionObserver cannot see the parent document scrolling.
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    if (event.data === 'jw-visible:false') { visible = false; clearTimeout(idleWake); playground.suspend(); cancelAnimationFrame(frame); frame = 0; }
    if (event.data === 'jw-visible:true') { visible = true; wake(); }
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    visible = false;
    playground.dispose();
    cancelAnimationFrame(frame);
    frame = 0;
    container.hidden = true;
    document.body.classList.remove('has-letter-playground');
  });
  container.dataset.model = 'piper-x-left-r5a-right';
  wake();
}
