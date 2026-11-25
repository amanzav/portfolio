import * as THREE from 'three';
import { REST_POSE, applyArmPose } from './motion-study.js';

const KEYS = Object.keys(REST_POSE);
const copyPose = pose => Object.fromEntries(KEYS.map(key => [key,
  Number.isFinite(pose?.[key]) ? pose[key] : REST_POSE[key]]));
const blendPose = (from, to, t) => Object.fromEntries(KEYS.map(key => [key, from[key] + (to[key] - from[key]) * t]));

export function createExperienceFollow({ arm, camera, restPose = REST_POSE }) {
  arm.updateWorldMatrix(true, true);
  const probe = arm.clone(true);
  probe.matrixAutoUpdate = false;
  probe.matrix.copy(arm.matrixWorld);
  const rest = copyPose(restPose);
  const parts = [];
  probe.traverse(mesh => {
    if (!mesh.isMesh) return;
    for (let parent = mesh; parent; parent = parent.parent) if (!parent.visible) return;
    const box = mesh.geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position);
    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      corners.push(new THREE.Vector3(x, y, z));
    }
    parts.push({ mesh, corners });
  });
  const viewProjection = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();
  const point = new THREE.Vector3();

  function configure({ width, height, canvasShift = 0, viewport, obstacles = [], halo = 14, softBand = 18 }) {
    if (!(Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0)) {
      throw new Error('Idle follow needs a finite positive viewport size.');
    }
    camera.updateWorldMatrix(true, false);
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    halo = Number.isFinite(halo) ? Math.max(0, halo) : 14;
    const area = viewport ?? { left: 0, top: 0, right: width, bottom: height };
    return { width, height, canvasShift, softBand,
      area: { left: area.left + halo, top: area.top + halo, right: area.right - halo, bottom: area.bottom - halo },
      obstacles: obstacles.map(rect => ({ left: rect.left - halo, top: rect.top - halo,
        right: (rect.right ?? rect.left + rect.width) + halo,
        bottom: (rect.bottom ?? rect.top + rect.height) + halo })),
    };
  }

  function evaluate(pose, config) {
    applyArmPose(probe, pose);
    const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    let clearance = Infinity;
    for (const { mesh, corners } of parts) {
      matrix.multiplyMatrices(viewProjection, mesh.matrixWorld);
      const e = matrix.elements;
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const corner of corners) {
        const w = e[3] * corner.x + e[7] * corner.y + e[11] * corner.z + e[15];
        point.copy(corner).applyMatrix4(matrix);
        if (!(w > 0) || !Number.isFinite(point.x + point.y + point.z) || Math.abs(point.z) > 1) clearance = -Infinity;
        const x = (point.x + 1) * config.width / 2 + config.canvasShift;
        const y = (1 - point.y) * config.height / 2;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      bounds.left = Math.min(bounds.left, left); bounds.top = Math.min(bounds.top, top);
      bounds.right = Math.max(bounds.right, right); bounds.bottom = Math.max(bounds.bottom, bottom);
      for (const obstacle of config.obstacles) {
        clearance = Math.min(clearance, Math.max(obstacle.left - right, left - obstacle.right,
          obstacle.top - bottom, top - obstacle.bottom));
      }
    }
    clearance = Math.min(clearance, bounds.left - config.area.left, bounds.top - config.area.top,
      config.area.right - bounds.right, config.area.bottom - bounds.bottom);
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return { safe: clearance >= .5, clearance, bounds };
  }

  function findRest(config, preferred = rest) {
    const base = copyPose(preferred);
    const original = evaluate(base, config);
    if (original.safe) return { pose: base, ...original };
    const tried = new Set();
    for (let step = 1; step <= 32; step++) for (const direction of [1, -1]) {
      const yaw = THREE.MathUtils.clamp(base.yaw + direction * step * .1, 0, Math.PI);
      if (tried.has(yaw)) continue;
      tried.add(yaw);
      const pose = { ...base, yaw };
      const result = evaluate(pose, config);
      if (result.safe) return { pose, ...result };
    }
    return { pose: base, ...original };
  }

  function safeRest(options, preferred) {
    return findRest(configure(options), preferred);
  }

  function constrain({ fromPose, candidatePose, ...options }) {
    const config = configure(options);
    const from = copyPose(fromPose);
    let candidate = copyPose(candidatePose);
    const initial = evaluate(from, config);
    if (!initial.safe) {
      const recovery = findRest(config);
      return { pose: from, bounds: initial.bounds, safe: false, blocked: true, progress: 0,
        startedUnsafe: true, recoveryPose: recovery.safe ? recovery.pose : null };
    }
    const desired = evaluate(candidate, config);
    let softened = 1;
    if (desired.clearance < initial.clearance - 1e-5 && config.softBand > 0) {
      softened = THREE.MathUtils.clamp((initial.clearance - .5) / config.softBand, .025, 1);
      candidate = blendPose(from, candidate, softened);
    }
    const maxAngle = Math.max(...KEYS.map(key => Math.abs(candidate[key] - from[key])));
    const steps = Math.max(8, Math.ceil(maxAngle / .06));
    let previous = 0;
    let last = initial;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const result = evaluate(blendPose(from, candidate, t), config);
      if (!result.safe) {
        let low = previous, high = t;
        for (let j = 0; j < 12; j++) {
          const middle = (low + high) / 2;
          const sample = evaluate(blendPose(from, candidate, middle), config);
          if (sample.safe) { low = middle; last = sample; } else high = middle;
        }
        const pose = blendPose(from, candidate, low);
        return { pose, bounds: last.bounds, safe: true, blocked: true, progress: low * softened, startedUnsafe: false };
      }
      previous = t;
      last = result;
    }
    return { pose: candidate, bounds: last.bounds, safe: true, blocked: softened < 1,
      progress: softened, startedUnsafe: false };
  }

  return { constrain, safeRest };
}
