import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { solveMagneticPose, MAGNETIC_LIMITS } from './magnetic-follow.js';
import { createFastFling, sampleFastFling, GRIP_END, RELEASE_TIME, RECOIL_END, END_TIME } from './fast-fling.js';

const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, a + ' != ' + b);
function directionalPlan(sign, y, fromPose = REST_POSE) {
  const releasePoint = { x: sign * (y < 2.5 ? 2.8 : 1.8), y, z: 0.5 };
  const release = solveMagneticPose(releasePoint.x, releasePoint.y, releasePoint.z);
  const settle = { ...solveMagneticPose(sign * 2.4, 3.2, 1.3), yaw: release.yaw, grip: 0 };
  return createFastFling({ fromPose, reachPose: solveMagneticPose(-sign * 3.1, y, 0.5), releasePoint, destination: { x: sign * 4.3, y, z: 0.5 }, direction: sign, settlePose: settle });
}

test('high and low throws settle facing their destination without returning to global rest', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const base = arm.getObjectByName('base').matrixWorld.clone();
  for (const sign of [-1, 1]) for (const y of [4.35, 1.9]) {
    const plan = directionalPlan(sign, y);
    const releaseYaw = plan.releasePose.yaw;
    for (let t = RELEASE_TIME; t <= END_TIME; t += 0.001) {
      const { pose } = sampleFastFling(plan, t);
      assert.ok(pose.yaw >= plan.yawLimits[0] && pose.yaw <= plan.yawLimits[1]);
      assert.ok(Math.abs(pose.yaw - releaseYaw) <= 0.10001);
      assert.equal(pose.grip, 0);
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(pose[key] >= min && pose[key] <= max);
      applyArmPose(arm, pose);
      assert.deepEqual(arm.getObjectByName('base').matrixWorld, base);
    }
    assert.deepEqual(sampleFastFling(plan, END_TIME).pose, plan.settlePose);
    assert.deepEqual(sampleFastFling(plan, END_TIME + 10).pose, plan.settlePose);
    assert.notDeepEqual(plan.settlePose, REST_POSE);
  }
});

test('directional follow-through preserves actual gripper release velocity and continuous joins', () => {
  const arm = createArmModel();
  for (const sign of [-1, 1]) for (const y of [4.35, 1.9]) {
    const plan = directionalPlan(sign, y);
    const dt = 1e-6;
    applyArmPose(arm, sampleFastFling(plan, RELEASE_TIME - dt).pose);
    const before = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    applyArmPose(arm, sampleFastFling(plan, RELEASE_TIME).pose);
    const release = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    applyArmPose(arm, sampleFastFling(plan, RELEASE_TIME + dt).pose);
    const after = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    for (const axis of ['x', 'y', 'z']) {
      near((release[axis] - before[axis]) / dt, plan.flight.velocity[axis], 0.005);
      near((after[axis] - release[axis]) / dt, plan.flight.velocity[axis], 0.01);
    }
    for (const boundary of [RELEASE_TIME, RECOIL_END, 1]) {
      const a = sampleFastFling(plan, boundary - dt).pose;
      const b = sampleFastFling(plan, boundary + dt).pose;
      for (const key of Object.keys(REST_POSE)) near(a[key], b[key], 0.001);
    }
  }
});

test('Back can start at the actual forward end pose and finish in the opposite hemisphere', () => {
  for (const y of [4.35, 1.9]) {
    const forward = directionalPlan(1, y);
    const liveEnd = sampleFastFling(forward, END_TIME).pose;
    const backRelease = solveMagneticPose(-1, Math.max(3.3, y), 1.6);
    const backSettle = { ...solveMagneticPose(-2.4, 3.2, 1.3), yaw: backRelease.yaw, grip: 0 };
    const back = createFastFling({ fromPose: liveEnd, reachPose: solveMagneticPose(3, 3.4, 1.6), releasePoint: backRelease.tip, destination: forward.home, direction: -1, settlePose: backSettle });
    assert.deepEqual(sampleFastFling(back, 0).pose, liveEnd);
    assert.equal(sampleFastFling(back, GRIP_END).pose.grip, 1);
    assert.deepEqual(sampleFastFling(back, END_TIME).pose, back.settlePose);
    for (const key of Object.keys(REST_POSE)) near(back.settlePose[key], backSettle[key]);
    assert.ok(backSettle.yaw < Math.PI / 2);
  }
});

test('legacy default remains global rest and supplied clamped poses stay safe', () => {
  const legacy = createFastFling();
  assert.deepEqual(sampleFastFling(legacy, END_TIME).pose, REST_POSE);
  const release = solveMagneticPose(100, -100, 0.5);
  const plan = createFastFling({ releasePoint: release.tip, settlePose: { shoulder: 100, elbow: -100, wrist: 100, yaw: release.yaw, roll: 0, grip: 1 } });
  const final = sampleFastFling(plan, END_TIME).pose;
  for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(final[key] >= min && final[key] <= max);
  assert.equal(final.grip, 0);
});
