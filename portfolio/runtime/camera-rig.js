import * as THREE from 'three';

const FOV = 28;
const PITCH = 0.12;
const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);

function corners(bounds) {
  const points = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) points.push(new THREE.Vector3(x, y, z));
    }
  }
  return points;
}

function axes(yaw) {
  return {
    backward: new THREE.Vector3(Math.sin(yaw) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(yaw) * Math.cos(PITCH)),
    right: new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)),
    up: new THREE.Vector3(-Math.sin(yaw) * Math.sin(PITCH), Math.cos(PITCH), -Math.cos(yaw) * Math.sin(PITCH)),
  };
}

export function createCameraStudyRig({ aspect = 2, armBounds, center } = {}) {
  aspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 2;
  const bounds = armBounds?.clone() ?? new THREE.Box3(new THREE.Vector3(-1.66, 0, -0.75), new THREE.Vector3(1.68, 4.43, 0.75));
  const armCenter = center?.clone() ?? bounds.getCenter(new THREE.Vector3());
  const points = corners(bounds);
  const exploreAxes = axes(THREE.MathUtils.degToRad(15));
  const choiceBounds = bounds.clone().union(new THREE.Box3(new THREE.Vector3(-4.9, -0.08, -0.8), new THREE.Vector3(4.9, 5.15, 0.8)));
  let exploreDistance = 0;
  for (const point of corners(choiceBounds)) {
    const delta = point.sub(armCenter);
    const depthOffset = exploreAxes.backward.dot(delta);
    exploreDistance = Math.max(exploreDistance,
      Math.abs(exploreAxes.right.dot(delta)) / (TAN_HALF_FOV * aspect * 0.88) + depthOffset,
      Math.abs(exploreAxes.up.dot(delta)) / (TAN_HALF_FOV * 0.88) + depthOffset);
  }
  const explore = { position: armCenter.clone().addScaledVector(exploreAxes.backward, exploreDistance), target: armCenter.clone() };

  function readView(side) {
    const yaw = THREE.MathUtils.degToRad(side === 'right' ? 25 : 5);
    const basis = axes(yaw);
    const ndcX = side === 'right' ? -0.7 : 0.7;
    let depthAtArm = (bounds.max.y - bounds.min.y) / (2 * TAN_HALF_FOV * 0.63);
    let target;
    let position;
    for (let attempt = 0; attempt < 20; attempt++) {
      target = new THREE.Vector3(
        (basis.right.dot(armCenter) + 0.3 * Math.sin(yaw) - ndcX * depthAtArm * TAN_HALF_FOV * aspect) / Math.cos(yaw),
        3,
        0.3,
      );
      const distance = depthAtArm + basis.backward.dot(armCenter.clone().sub(target));
      position = target.clone().addScaledVector(basis.backward, distance);
      const fits = points.every(point => {
        const delta = point.clone().sub(position);
        const depth = -basis.backward.dot(delta);
        return depth > 0 && Math.abs(basis.right.dot(delta) / (depth * TAN_HALF_FOV * aspect)) < 0.95
          && Math.abs(basis.up.dot(delta) / (depth * TAN_HALF_FOV)) < 0.9;
      });
      if (fits) break;
      depthAtArm *= 1.05;
    }
    return { position, target };
  }

  const readRight = readView('right');
  const readLeft = readView('left');
  return {
    fov: FOV,
    near: 0.1,
    far: 100,
    aspect,
    views: { explore, readRight, readLeft },
    docks: { right: readRight.target.clone(), left: readLeft.target.clone() },
    // Candidate only. The actual grasp must be checked against the title width.
    gripDocks: { right: new THREE.Vector3(3, 3, 0.3), left: new THREE.Vector3(-3, 3, 0.3) },
  };
}

export function sampleCameraStudy(rig, fromView, toView, progress) {
  const from = typeof fromView === 'string' ? rig.views[fromView] : fromView;
  const to = typeof toView === 'string' ? rig.views[toView] : toView;
  const t = smooth(THREE.MathUtils.clamp(Number.isFinite(progress) ? progress : 0, 0, 1));
  return { position: from.position.clone().lerp(to.position, t), target: from.target.clone().lerp(to.target, t) };
}
