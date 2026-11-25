export const MAGNETIC_ARM = Object.freeze({ upper: 2.15, fore: 2.05, tool: 1.26, shoulderHeight: 0.85 });
export const MAGNETIC_LIMITS = Object.freeze({
  shoulder: [0.08, 2.4],
  elbow: [0.35, 2.35],
  wrist: [-2.8, 2.8],
});

const REST = Object.freeze({ shoulder: 0.98, elbow: 1.45, wrist: 0.62, yaw: 0, roll: 0, grip: 0 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothUnit = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const positiveAngle = (y, x) => {
  const angle = Math.atan2(y, x);
  return angle < 0 ? angle + Math.PI * 2 : angle;
};

// Preserve ordinary targets, then ease asymptotically into workspace boundaries.
function softBound(value, min, max, band = 0.18) {
  if (value < min + band) return min + band * Math.exp((value - min - band) / band);
  if (value > max - band) return max - band * Math.exp((max - band - value) / band);
  return value;
}

export function magneticTurnDepth(u) {
  if (!Number.isFinite(u) || Math.abs(u) >= 2.4) return 0;
  return 1.2 * (1 - (u / 2.4) ** 2) ** 2;
}

export function forwardTip(pose) {
  const { upper, fore, tool, shoulderHeight } = MAGNETIC_ARM;
  const foreAngle = pose.shoulder + pose.elbow;
  const toolAngle = foreAngle + pose.wrist;
  const localX = upper * Math.cos(pose.shoulder) + fore * Math.cos(foreAngle) + tool * Math.cos(toolAngle);
  return {
    x: localX * Math.cos(pose.yaw),
    y: shoulderHeight + upper * Math.sin(pose.shoulder) + fore * Math.sin(foreAngle) + tool * Math.sin(toolAngle),
    z: -localX * Math.sin(pose.yaw),
  };
}

export function solveMagneticPose(x, y, z = magneticTurnDepth(x)) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return { ...REST, tip: forwardTip(REST), clamped: true };
  }

  const { upper, fore, tool, shoulderHeight } = MAGNETIC_ARM;
  const depth = Math.max(0, z);
  const radius = Math.hypot(x, depth);
  const yaw = radius > 1e-8 ? Math.atan2(depth, -x) : Math.PI / 2;
  // Stay on the approved elbow branch. The turret turns the negative-X arm
  // plane around the target instead of switching its bend at screen center.
  const targetX = -softBound(radius, 0.75, 4.7);
  const clearance = smoothUnit((radius - 1.8) / 1.2);
  const floorClearance = smoothUnit((radius - 0.7) / 0.4);
  const targetY = softBound(y, 1.55 - 1.1 * floorClearance, 5.4);
  const toolRise = Math.max(0.35 * (1 - clearance), targetY - shoulderHeight);
  const radialAngle = positiveAngle(toolRise, targetX);
  const downward = (1 - smoothUnit((targetY - 0.7) / 1.2)) * (1 - smoothUnit((radius - 2.2) / 1.0));
  const downwardAngle = 5.4 - 0.3 * Math.min(radius, 2.4);
  const toolAngle = radialAngle + (downwardAngle - radialAngle) * downward;
  const wristX = targetX - tool * Math.cos(toolAngle);
  // Outboard reaches can descend beside the pedestal. Near its axis, retain
  // the raised wrist and upward tool so the assembly cannot fold through it.
  const wristY = softBound(targetY - shoulderHeight - tool * Math.sin(toolAngle), 0.25 - 0.6 * clearance, 5);
  const distance = Math.hypot(wristX, wristY);
  const cosine = (distance ** 2 - upper ** 2 - fore ** 2) / (2 * upper * fore);
  const elbow = clamp(Math.acos(clamp(cosine, -1, 1)), ...MAGNETIC_LIMITS.elbow);
  const shoulder = clamp(
    positiveAngle(wristY, wristX) - Math.atan2(fore * Math.sin(elbow), upper + fore * Math.cos(elbow)),
    ...MAGNETIC_LIMITS.shoulder,
  );
  const wrist = clamp(toolAngle - shoulder - elbow, ...MAGNETIC_LIMITS.wrist);
  const pose = { shoulder, elbow, wrist, yaw, roll: 0, grip: 0 };
  const tip = forwardTip(pose);
  return { ...pose, tip, clamped: Math.hypot(tip.x - x, tip.y - y, tip.z - z) > 0.015 };
}
