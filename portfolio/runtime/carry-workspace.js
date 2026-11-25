import { createDragPlace, sampleDragPlace } from './drag-place.js';
import { MAGNETIC_ARM, MAGNETIC_LIMITS, solveMagneticPose, forwardTip } from './magnetic-follow.js';
import { workspaceGrip, workspacePlanePoint } from './workspace-layout.js';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * t * (10 + t * (-15 + 6 * t)); };

export function readyPoseFacingPlace(placePose, returnHome = false) {
  const { upper, fore, shoulderHeight } = MAGNETIC_ARM;
  const placed = forwardTip(placePose);
  const wristX = 0.2;
  const wristY = (returnHome ? 3.7 : 3.5) - shoulderHeight;
  const cosine = (wristX ** 2 + wristY ** 2 - upper ** 2 - fore ** 2) / (2 * upper * fore);
  const elbow = Math.acos(Math.max(-1, Math.min(1, cosine)));
  const shoulder = Math.atan2(wristY, wristX) - Math.atan2(fore * Math.sin(elbow), upper + fore * Math.cos(elbow));
  const localTipX = -Math.hypot(placed.x, placed.z);
  let toolAngle = Math.atan2(placed.y - shoulderHeight - wristY, localTipX - wristX);
  if (toolAngle < 0) toolAngle += Math.PI * 2;
  const result = { ...placePose, shoulder, elbow, wrist: toolAngle - shoulder - elbow, grip: 0 };
  if (Object.entries(MAGNETIC_LIMITS).some(([key, [min, max]]) => result[key] < min || result[key] > max)) {
    return { ...placePose, grip: 0 };
  }
  return result;
}

export function createCarryWorkspace({ camera, layout, fromPose, sourcePixel, destinationPixel,
  fromComposition = 0, toComposition = 1, gripFraction = 0.5, returnHome = toComposition === 0, readyPixel } = {}) {
  const source = workspaceGrip(sourcePixel, camera, layout, fromComposition);
  const destination = workspaceGrip(destinationPixel, camera, layout, toComposition);
  const facing = readyPixel ? workspaceGrip(readyPixel, camera, layout, toComposition).pose : destination.pose;
  const nextPose = readyPoseFacingPlace(facing, returnHome);
  const plan = createDragPlace({ fromPose, reachPose: source.pose, placePose: destination.pose, nextPose });
  plan.timing.placeTime = 0.48;
  plan.timing.releaseTime = 0.525;
  plan.timing.turnEnd = 0.675;
  plan.timing.endTime = 0.695;
  plan.landTime = plan.timing.placeTime;
  plan.endTime = plan.timing.endTime;
  return { ...plan, camera: camera.clone(), layout: { ...layout }, fromComposition, toComposition,
    sourcePixel: { ...sourcePixel }, destinationPixel: { ...destinationPixel },
    sourceDepth: source.point.z, destinationDepth: destination.point.z, gripFraction,
    depthRise: Math.max(0, 3 - (source.point.z + destination.point.z) / 2) };
}

export function sampleCarryWorkspace(plan, seconds) {
  const state = sampleDragPlace(plan, seconds);
  const progress = smooth(state.progress);
  const composition = plan.fromComposition + (plan.toComposition - plan.fromComposition) * progress;
  const screen = { x: plan.sourcePixel.x + (plan.destinationPixel.x - plan.sourcePixel.x) * progress,
    y: plan.sourcePixel.y + (plan.destinationPixel.y - plan.sourcePixel.y) * progress };
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (time > plan.timing.gripEnd && time < plan.timing.placeTime) {
    const z = plan.sourceDepth + (plan.destinationDepth - plan.sourceDepth) * progress + plan.depthRise * Math.sin(Math.PI * progress) ** 2;
    const point = workspacePlanePoint(screen, plan.camera, plan.layout, composition, z);
    const pose = { ...solveMagneticPose(point.x, point.y, point.z), grip: 1 };
    state.pose = pose;
    state.gripWorld = forwardTip(pose);
  }
  return { ...state, composition, sceneProgress: progress, screen };
}
