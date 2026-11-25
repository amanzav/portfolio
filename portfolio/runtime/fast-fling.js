import { REST_POSE } from './motion-study.js';
import { MAGNETIC_ARM, MAGNETIC_LIMITS, forwardTip, solveMagneticPose } from './magnetic-follow.js';
import { toolRetreatPose } from './drag-place.js';

export const REACH_END = 0.14;
export const GRIP_END = 0.23;
export const CARRY_END = 0.59;
export const RELEASE_TIME = CARRY_END;
export const FLIGHT_DURATION = 0.27;
export const LAND_TIME = 0.86;
export const RECOIL_END = 0.73;
export const END_TIME = 1.1;
const REST_TIME = 1;
export const LEGACY_FLING_TIMING = Object.freeze({ reachEnd: REACH_END, gripEnd: GRIP_END, releaseTime: RELEASE_TIME, recoilEnd: RECOIL_END, restTime: REST_TIME, endTime: END_TIME });
export const COMPACT_FLING_TIMING = Object.freeze({ reachEnd: 0.10, gripEnd: 0.16, releaseTime: 0.30, recoilEnd: 0.60, restTime: 0.60, endTime: 0.70 });
const KEYS = Object.keys(REST_POSE);
const AXES = ['x', 'y', 'z'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);

function safePose(source) {
  const pose = Object.fromEntries(KEYS.map(key => [key, Number.isFinite(source?.[key]) ? source[key] : REST_POSE[key]]));
  for (const [key, limits] of Object.entries(MAGNETIC_LIMITS)) pose[key] = clamp(pose[key], ...limits);
  pose.grip = clamp(pose.grip, 0, 1);
  return pose;
}

function vector(source, fallback) {
  return Object.fromEntries(AXES.map(axis => [axis, Number.isFinite(source?.[axis]) ? source[axis] : fallback[axis]]));
}

function blend(from, to, t) {
  const amount = smooth(clamp(t, 0, 1));
  return Object.fromEntries(KEYS.map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}

function carryPoint(plan, progress) {
  const t = clamp(progress, 0, 1);
  const duration = plan.timing.releaseTime - plan.timing.gripEnd;
  const { home, flight } = plan;
  const end = flight.origin;
  const h01 = -2 * t ** 3 + 3 * t ** 2;
  const h11 = t ** 3 - t ** 2;
  const travel = end.x - home.x;
  const releaseRatio = duration * flight.velocity.x / travel;
  // A short carry near full reach needs a late wrist flick rather than a long
  // airborne wait. The power curve stays monotonic and meets release velocity.
  const x = releaseRatio > 3
    ? home.x + travel * t ** releaseRatio
    : home.x + travel * h01 + duration * flight.velocity.x * h11;
  const radius = Math.max(0.01, Math.abs(x * home.x >= 0 ? home.x : end.x));
  const dome = Math.max(0, 1 - (x / radius) ** plan.turnPower) ** 2;
  const baselineDepth = home.z + (end.z - home.z) * smooth(t);
  const depth = Math.max(0, plan.turnDepth - baselineDepth);
  const z = baselineDepth + duration * flight.velocity.z * h11 + depth * dome;
  const compressionDuration = Math.min(0.22, duration * 0.3);
  const compressionT = clamp((t * duration - duration + compressionDuration) / compressionDuration, 0, 1);
  let y = home.y + (end.y - home.y) * smooth(t)
    + compressionDuration * flight.velocity.y * (compressionT ** 3 - compressionT ** 2);
  const { upper, fore, tool, shoulderHeight } = MAGNETIC_ARM;
  const innerDistance = tool + Math.sqrt(upper ** 2 + fore ** 2 + 2 * upper * fore * Math.cos(MAGNETIC_LIMITS.elbow[1]));
  const minDistance = innerDistance + 0.02;
  const clearanceY = shoulderHeight + Math.sqrt(Math.max(0, minDistance ** 2 - x ** 2 - z ** 2));
  const difference = plan.compactFling || home.y < 1.2 || x ** 2 + z ** 2 >= innerDistance ** 2 ? -Infinity : clearanceY - y;
  const band = 0.01;
  // Low rows lift only enough to clear the inner reach limit during the turn.
  y += difference <= -band ? 0 : difference >= band ? difference : (difference + band) ** 2 / (4 * band);
  return { x, y, z };
}

function carryPose(plan, progress) {
  if (progress <= 0) return { ...plan.reachPose, grip: 1 };
  if (progress >= 1) return { ...plan.releasePose, grip: 1 };
  const point = carryPoint(plan, progress);
  return { ...safePose(solveMagneticPose(point.x, point.y, point.z)), grip: 1 };
}

function momentumCoast(start, velocity, limits, maximumAdvance, maximumDuration = 0.12) {
  const available = velocity > 0 ? limits[1] - start : start - limits[0];
  const advance = Math.max(0, Math.min(maximumAdvance, available * 0.8));
  const duration = Math.abs(velocity) > 1e-8 ? Math.min(maximumDuration, 3 * advance / Math.abs(velocity)) : 0;
  return { velocity, duration, advance: velocity * duration / 3 };
}

function coastOffset(coast, seconds) {
  if (!coast.duration) return 0;
  const t = clamp(seconds, 0, coast.duration);
  return coast.velocity * (t - t * t / coast.duration + t ** 3 / (3 * coast.duration ** 2));
}

function compactFollowThrough(plan, seconds) {
  const pose = { ...plan.releasePose, grip: 0 };
  for (const key of ['shoulder', 'elbow', 'wrist']) pose[key] += coastOffset(plan.followThrough[key], seconds);
  const yaw = plan.followThrough.yaw;
  if (plan.throwSettle) {
    if (seconds <= 0.05) return { ...pose, yaw: plan.releasePose.yaw + coastOffset(yaw, seconds) };
    const progress = smooth(clamp((seconds - 0.05) / (plan.timing.recoilEnd - plan.timing.releaseTime - 0.05), 0, 1));
    return toolRetreatPose(plan.throwCoastPose, plan.pullbackDistance * progress) ?? { ...plan.throwCoastPose };
  }
  const progress = smooth(clamp(seconds / (plan.timing.recoilEnd - plan.timing.releaseTime), 0, 1));
  pose.yaw += coastOffset(yaw, seconds) + (plan.settlePose.yaw - plan.releasePose.yaw - yaw.advance) * progress;
  return pose;
}

export function createFastFling({ fromPose, reachPose, releasePoint, destination, direction, flightDuration = FLIGHT_DURATION, settlePose, recoilPose, turnDepth = 1.6, turnPower = 2, compactFling = false, throwSettle = false } = {}) {
  const reach = { ...safePose(reachPose ?? solveMagneticPose(-3.1, 3.1, 0.5)), grip: 0 };
  const home = forwardTip(reach);
  const sign = Number.isFinite(direction) && direction !== 0 ? Math.sign(direction) : home.x <= 0 ? 1 : -1;
  const requestedRelease = vector(releasePoint, { x: sign * (home.y < 2.5 ? 2.8 : 1.8), y: home.y, z: 0.5 });
  const release = { ...safePose(solveMagneticPose(requestedRelease.x, requestedRelease.y, requestedRelease.z)), grip: 0 };
  const origin = forwardTip(release);
  const dock = vector(destination, { x: sign * 4.3, y: origin.y, z: origin.z });
  const duration = Number.isFinite(flightDuration) && flightDuration > 0 ? flightDuration : FLIGHT_DURATION;
  const gravity = { x: 0, y: -9.81, z: 0 };
  const velocity = Object.fromEntries(AXES.map(axis => [axis, (dock[axis] - origin[axis] - 0.5 * gravity[axis] * duration ** 2) / duration]));
  const directionalSettle = !!settlePose;
  const yawLimits = compactFling ? [0, Math.PI] : origin.x >= 0 ? [Math.PI / 2, Math.PI] : [0, Math.PI / 2];
  const settle = { ...safePose(settlePose ?? REST_POSE), grip: 0 };
  const recoil = { ...safePose(recoilPose ?? (directionalSettle ? settle : solveMagneticPose(0, 3.3, 1.6))), grip: 0 };
  if (directionalSettle) {
    settle.yaw = clamp(settle.yaw, ...yawLimits);
    recoil.yaw = clamp(recoil.yaw, ...yawLimits);
  }
  const plan = {
    fromPose: safePose(fromPose), reachPose: reach, home, releasePose: release, compactFling,
    throwSettle: compactFling && throwSettle,
    timing: { ...(compactFling ? COMPACT_FLING_TIMING : LEGACY_FLING_TIMING) },
    turnDepth: Number.isFinite(turnDepth) ? clamp(turnDepth, 0, 3.2) : 1.6, turnPower: turnPower === 4 ? 4 : 2,
    recoilPose: recoil, settlePose: settle, directionalSettle, yawLimits,
    flight: { origin, velocity, destination: dock, gravity, duration },
  };
  const dt = 1e-5;
  const before = carryPose(plan, 1 - dt / (plan.timing.releaseTime - plan.timing.gripEnd));
  plan.jointReleaseVelocity = Object.fromEntries(KEYS.map(key => [key, key === 'grip' ? 0 : (release[key] - before[key]) / dt]));
  if (compactFling) {
    if (plan.throwSettle) {
      plan.timing.recoilEnd = 0.55;
      plan.timing.restTime = 0.55;
    }
    plan.followThrough = {};
    for (const key of ['shoulder', 'elbow', 'wrist']) {
      const coast = momentumCoast(release[key], plan.jointReleaseVelocity[key], MAGNETIC_LIMITS[key], plan.throwSettle ? 0.02 : 0.12, plan.throwSettle ? 0.05 : 0.12);
      plan.followThrough[key] = coast;
      plan.settlePose[key] = release[key] + coast.advance;
    }
    const targetDifference = plan.settlePose.yaw - release.yaw;
    const aligned = targetDifference * plan.jointReleaseVelocity.yaw > 0;
    const yawAdvance = plan.throwSettle ? 0.01 : aligned ? Math.min(0.06, Math.abs(targetDifference) * 0.4) : 0.06;
    plan.followThrough.yaw = momentumCoast(release.yaw, plan.jointReleaseVelocity.yaw, yawLimits, yawAdvance, plan.throwSettle ? 0.05 : 0.10);
    if (plan.throwSettle) {
      plan.throwCoastPose = { ...plan.releasePose, grip: 0 };
      for (const key of ['shoulder', 'elbow', 'wrist', 'yaw']) plan.throwCoastPose[key] += plan.followThrough[key].advance;
      plan.pullbackDistance = [0.35, 0.25].find(distance => Array.from({ length: 13 }, (_, index) => toolRetreatPose(plan.throwCoastPose, distance * index / 12)).every(Boolean)) ?? 0;
      plan.settlePose = toolRetreatPose(plan.throwCoastPose, plan.pullbackDistance) ?? { ...plan.throwCoastPose };
    }
    plan.recoilPose = { ...plan.settlePose };
  }
  return plan;
}

export function sampleFastFling(plan, seconds) {
  const timing = plan.timing ?? LEGACY_FLING_TIMING;
  const time = clamp(Number.isFinite(seconds) ? seconds : 0, 0, timing.endTime);
  let pose;
  let phase;
  if (time < timing.reachEnd) {
    phase = 'reach';
    pose = blend(plan.fromPose, plan.reachPose, time / timing.reachEnd);
  } else if (time < timing.gripEnd) {
    phase = 'grip';
    pose = blend(plan.reachPose, { ...plan.reachPose, grip: 1 }, (time - timing.reachEnd) / (timing.gripEnd - timing.reachEnd));
  } else if (time < timing.releaseTime) {
    phase = 'carry';
    pose = carryPose(plan, (time - timing.gripEnd) / (timing.releaseTime - timing.gripEnd));
    pose.grip = 1 - smooth(clamp((time - timing.releaseTime + 0.025) / 0.025, 0, 1));
  } else if (plan.compactFling) {
    phase = time === timing.endTime ? 'done' : 'return';
    pose = compactFollowThrough(plan, time - timing.releaseTime);
  } else if (time < timing.recoilEnd) {
    phase = 'return';
    const duration = timing.recoilEnd - timing.releaseTime;
    const t = (time - timing.releaseTime) / duration;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    pose = safePose(Object.fromEntries(KEYS.map(key => [key, h00 * plan.releasePose[key] + h10 * duration * plan.jointReleaseVelocity[key] + h01 * plan.recoilPose[key]])));
    if (plan.directionalSettle) {
      // Preserve release momentum but shorten its decay before it can turn the
      // turret out of the destination hemisphere or overshoot by more than .1rad.
      const yawDuration = Math.min(duration, 0.675 / Math.max(0.001, Math.abs(plan.jointReleaseVelocity.yaw)));
      const u = clamp((time - timing.releaseTime) / yawDuration, 0, 1);
      pose.yaw = clamp((2 * u ** 3 - 3 * u ** 2 + 1) * plan.releasePose.yaw
        + (u ** 3 - 2 * u ** 2 + u) * yawDuration * plan.jointReleaseVelocity.yaw
        + (-2 * u ** 3 + 3 * u ** 2) * plan.recoilPose.yaw, ...plan.yawLimits);
    }
    pose.grip = 0;
  } else if (time < timing.restTime) {
    phase = 'return';
    pose = blend(plan.recoilPose, plan.settlePose, (time - timing.recoilEnd) / (timing.restTime - timing.recoilEnd));
  } else {
    phase = time === timing.endTime ? 'done' : 'return';
    pose = { ...plan.settlePose };
  }
  return { pose, phase, attached: time >= timing.gripEnd && time < timing.releaseTime, released: time >= timing.releaseTime, flightTime: Math.max(0, time - timing.releaseTime), done: time === timing.endTime, gripWorld: forwardTip(pose) };
}

export function sampleFastFlight(flight, seconds) {
  const time = clamp(Number.isFinite(seconds) ? seconds : 0, 0, flight.duration);
  const progress = time / flight.duration;
  return {
    position: Object.fromEntries(AXES.map(axis => [axis, progress === 1 ? flight.destination[axis] : flight.origin[axis] + flight.velocity[axis] * time + 0.5 * flight.gravity[axis] * time ** 2])),
    velocity: Object.fromEntries(AXES.map(axis => [axis, flight.velocity[axis] + flight.gravity[axis] * time])),
    progress, done: progress === 1,
  };
}
