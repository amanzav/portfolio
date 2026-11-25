import * as THREE from 'three';
import { solveMagneticPose, forwardTip } from './magnetic-follow.js';

export function screenPlanePoint({ camera, width, height, pixel, z = 0.5 }) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(pixel.x / width * 2 - 1, 1 - pixel.y / height * 2), camera);
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), new THREE.Vector3());
}

export function solveScreenGrip({ camera, width, height, pixel, preferredZ = 1.6 }) {
  let best;
  for (let i = 0; i <= 120; i++) {
    const z = i * 0.025;
    const point = screenPlanePoint({ camera, width, height, pixel, z });
    if (!point) continue;
    const pose = solveMagneticPose(point.x, point.y, point.z);
    const tip = forwardTip(pose);
    const projected = new THREE.Vector3(tip.x, tip.y, tip.z).project(camera);
    const error = Math.hypot((projected.x + 1) * width / 2 - pixel.x, (1 - projected.y) * height / 2 - pixel.y);
    const score = error * 1000 + Math.abs(z - preferredZ);
    if (!best || score < best.score) best = { pose, point: new THREE.Vector3(tip.x, tip.y, tip.z), error, score };
  }
  if (!best || best.error > 0.5) throw new Error('The title edge is outside the visible gripper workspace.');
  return best;
}
