import * as THREE from 'three';

export const MOTION_DURATION = 12;
export const REST_POSE = Object.freeze({ shoulder: 0.98, elbow: 1.45, wrist: 0.62, yaw: 0, roll: 0, grip: 0 });
const poses = [
  { at: 0, label: 'Rest', ...REST_POSE },
  { at: 0.6, label: 'Reach', ...REST_POSE },
  { at: 3.6, label: 'Wrist turn', shoulder: 0.82, elbow: 1.26, wrist: 0.7, yaw: -0.09, roll: 0, grip: 0 },
  { at: 6.0, label: 'Depth', shoulder: 1.08, elbow: 1.48, wrist: 0.28, yaw: -0.09, roll: 0.22, grip: 0.6 },
  { at: 9.0, label: 'Return', shoulder: 1.08, elbow: 1.48, wrist: 0.28, yaw: 0.2, roll: -0.13, grip: 0.2 },
  { at: MOTION_DURATION, label: 'Rest', ...REST_POSE },
];

export function sampleMotion(seconds) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.min(MOTION_DURATION, seconds)) : 0;
  const index = poses.findIndex((pose, i) => i > 0 && time <= pose.at);
  const to = poses[index < 0 ? poses.length - 1 : index];
  const from = poses[Math.max(0, index - 1)];
  const t = Math.max(0, Math.min(1, (time - from.at) / Math.max(0.001, to.at - from.at)));
  // Zero velocity and acceleration at the joins make this slow inspection pass easy to pause.
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  const pose = { label: time === MOTION_DURATION ? 'Rest' : from.label };
  for (const key of Object.keys(REST_POSE)) pose[key] = from[key] + (to[key] - from[key]) * eased;
  return pose;
}

export function applyArmPose(arm, pose) {
  arm.getObjectByName('turret').rotation.y = pose.yaw;
  arm.getObjectByName('shoulder').rotation.z = pose.shoulder;
  arm.getObjectByName('elbow').rotation.z = pose.elbow;
  const wrist = arm.getObjectByName('wrist');
  wrist.rotation.set(pose.roll, 0, pose.wrist);
  const grip = THREE.MathUtils.clamp(Number.isFinite(pose.grip) ? pose.grip : 0, 0, 1);
  arm.getObjectByName('fingerUpper').rotation.z = -0.54 * grip;
  arm.getObjectByName('fingerLower').rotation.z = 0.54 * grip;
  arm.getObjectByName('gripPadUpper').rotation.z = 0.54 * grip;
  arm.getObjectByName('gripPadLower').rotation.z = 0.54 * grip;
  arm.updateMatrixWorld(true);
}

export function getMotionBounds(arm) {
  const bounds = new THREE.Box3();
  for (let i = 0; i <= 48; i++) {
    applyArmPose(arm, sampleMotion(i / 48 * MOTION_DURATION));
    bounds.union(new THREE.Box3().setFromObject(arm));
  }
  applyArmPose(arm, REST_POSE);
  return bounds;
}
