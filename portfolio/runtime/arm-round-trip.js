import { createFastFling } from './fast-fling.js';
import { forwardTip, solveMagneticPose } from './magnetic-follow.js';

export function createArmOnlyGesture({ fromPose, reachPose, destination }) {
  const pickup = forwardTip(reachPose);
  const direction = Math.sign(destination.x - pickup.x) || 1;
  const low = Math.max(pickup.y, destination.y) < 2.6;
  const releasePoint = { x: direction * 1.8, y: destination.y, z: low ? 2.1 : destination.z };
  const release = solveMagneticPose(releasePoint.x, releasePoint.y, releasePoint.z);
  const settle = solveMagneticPose(direction * 2.1, low ? 2.9 : 3.3, 0.8);
  settle.yaw = solveMagneticPose(destination.x, destination.y, destination.z).yaw;
  const recoil = { ...settle, yaw: (release.yaw + settle.yaw) / 2 };
  return createFastFling({
    fromPose, reachPose, destination, releasePoint, settlePose: settle, recoilPose: recoil,
    turnDepth: low ? 3 : 1.6, turnPower: low ? 4 : 2,
  });
}

export function pointerMovedSinceLanding(origin, pointer) {
  return !!origin && Math.hypot(pointer.x - origin.x, pointer.y - origin.y) >= 6;
}
