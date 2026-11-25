import { REST_POSE } from './motion-study.js';
import { MAGNETIC_ARM, MAGNETIC_LIMITS, forwardTip } from './magnetic-follow.js';

const KEYS = Object.keys(REST_POSE);
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * t * (10 + t * (-15 + 6 * t)); };

function poseOf(source) {
  const pose = Object.fromEntries(KEYS.map(key => [key, Number.isFinite(source?.[key]) ? source[key] : REST_POSE[key]]));
  for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) pose[key] = Math.max(min, Math.min(max, pose[key]));
  pose.yaw = Math.max(0, Math.min(Math.PI, pose.yaw));
  pose.grip = clamp(pose.grip);
  return pose;
}

function blend(from, to, progress) {
  const amount = smooth(progress);
  return Object.fromEntries(KEYS.map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}

export function toolRetreatPose(source, distance) {
  const pose = poseOf(source);
  const { upper, fore } = MAGNETIC_ARM;
  const toolAngle = pose.shoulder + pose.elbow + pose.wrist;
  const foreAngle = pose.shoulder + pose.elbow;
  const x = upper * Math.cos(pose.shoulder) + fore * Math.cos(foreAngle) - distance * Math.cos(toolAngle);
  const y = upper * Math.sin(pose.shoulder) + fore * Math.sin(foreAngle) - distance * Math.sin(toolAngle);
  const cosine = (x * x + y * y - upper * upper - fore * fore) / (2 * upper * fore);
  if (!Number.isFinite(distance) || distance < 0 || cosine < -1 || cosine > 1) return null;
  const elbow = Math.acos(cosine);
  let polar = Math.atan2(y, x);
  if (polar < 0) polar += Math.PI * 2;
  const shoulder = polar - Math.atan2(fore * Math.sin(elbow), upper + fore * Math.cos(elbow));
  const wrist = toolAngle - shoulder - elbow;
  const result = { ...pose, shoulder, elbow, wrist, grip: 0 };
  if (Object.entries(MAGNETIC_LIMITS).some(([key, [min, max]]) => result[key] < min || result[key] > max)) return null;
  return result;
}

export function createDragPlace({ fromPose = REST_POSE, reachPose, placePose, nextPose, retreatDistance = 0 } = {}) {
  if (!reachPose || !placePose) throw new Error('Drag and place needs exact pickup and placement poses.');
  const reach = { ...poseOf(reachPose), grip: 0 };
  const place = { ...poseOf(placePose), grip: 1 };
  const retreat = Number.isFinite(retreatDistance) && retreatDistance > 0
    && Array.from({ length: 17 }, (_, index) => toolRetreatPose(place, retreatDistance * index / 16)).every(Boolean)
    ? retreatDistance : 0;
  const next = { ...poseOf(retreat ? toolRetreatPose(place, retreat) : nextPose ?? place), grip: 0 };
  const timing = { reachEnd: 0.12, gripEnd: 0.20, placeTime: 0.58, releaseTime: 0.66,
    turnEnd: retreat ? 0.84 : nextPose ? 0.94 : 0.66, endTime: retreat ? 0.88 : nextPose ? 0.96 : 0.74 };
  return { fromPose: poseOf(fromPose), reachPose: reach, placePose: place, nextPose: next,
    retreatDistance: retreat, timing, home: forwardTip(reach), place: forwardTip(place), landTime: timing.placeTime, endTime: timing.endTime };
}

export function sampleDragPlace(plan, seconds) {
  const t = Math.max(0, Math.min(plan.endTime, Number.isFinite(seconds) ? seconds : 0));
  const timing = plan.timing;
  let pose, phase;
  if (t < timing.reachEnd) {
    phase = 'reach';
    pose = blend(plan.fromPose, plan.reachPose, t / timing.reachEnd);
  } else if (t < timing.gripEnd) {
    phase = 'grip';
    pose = blend(plan.reachPose, { ...plan.reachPose, grip: 1 }, (t - timing.reachEnd) / (timing.gripEnd - timing.reachEnd));
  } else if (t < timing.placeTime) {
    phase = 'drag';
    pose = blend({ ...plan.reachPose, grip: 1 }, plan.placePose, (t - timing.gripEnd) / (timing.placeTime - timing.gripEnd));
  } else if (t < timing.releaseTime) {
    phase = 'place';
    pose = { ...plan.placePose, grip: 1 - smooth((t - timing.placeTime) / (timing.releaseTime - timing.placeTime)) };
  } else {
    phase = t === plan.endTime ? 'done' : plan.retreatDistance ? 'retreat' : timing.turnEnd > timing.releaseTime ? 'turn' : 'place';
    pose = plan.retreatDistance
      ? toolRetreatPose(plan.placePose, plan.retreatDistance * smooth((t - timing.releaseTime) / (timing.turnEnd - timing.releaseTime)))
      : timing.turnEnd > timing.releaseTime
      ? blend({ ...plan.placePose, grip: 0 }, plan.nextPose, (t - timing.releaseTime) / (timing.turnEnd - timing.releaseTime))
      : { ...plan.placePose, grip: 0 };
  }
  return { pose, gripWorld: forwardTip(pose), phase,
    progress: clamp((t - timing.gripEnd) / (timing.placeTime - timing.gripEnd)),
    attached: t >= timing.gripEnd && t < timing.releaseTime,
    placed: t >= timing.placeTime, released: t >= timing.releaseTime, done: t === plan.endTime };
}
