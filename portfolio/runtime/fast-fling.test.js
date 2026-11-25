import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS, solveMagneticPose } from './magnetic-follow.js';
import { REACH_END, GRIP_END, RELEASE_TIME, RECOIL_END, FLIGHT_DURATION, LAND_TIME, END_TIME, createFastFling, sampleFastFling, sampleFastFlight } from './fast-fling.js';

const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
function makePlan(direction, y, dock = 4.3) {
  const reachPose = solveMagneticPose(-direction * 3.1, y, 0.5);
  return createFastFling({ fromPose: REST_POSE, reachPose, direction, releasePoint: { x: direction * (y < 2.5 ? 2.8 : 1.8), y: reachPose.tip.y, z: 0.5 }, destination: { x: direction * dock, y: reachPose.tip.y, z: 0.5 } });
}

test('all six rows carry continuously across the center without a stop or yaw flip', () => {
  for (const direction of [-1, 1]) for (const y of [1.9, 3.1, 4.35]) {
    const plan = makePlan(direction, y);
    let previous = sampleFastFling(plan, GRIP_END);
    let centerSpeed = null;
    for (let t = GRIP_END + 0.001; t < RELEASE_TIME; t += 0.001) {
      const frame = sampleFastFling(plan, t);
      assert.ok(direction * (frame.gripWorld.x - previous.gripWorld.x) >= -1e-8);
      assert.ok(Math.abs(frame.pose.yaw - previous.pose.yaw) < 0.05);
      assert.ok(frame.gripWorld.z <= 1.601);
      if (Math.abs(frame.gripWorld.x) < 0.03) centerSpeed = Math.abs((frame.gripWorld.x - previous.gripWorld.x) / 0.001);
      previous = frame;
    }
    assert.ok(centerSpeed > 2);
  }
});

test('the actual model hands its velocity to gravity-only flight for every row and long dock', () => {
  const arm = createArmModel();
  for (const direction of [-1, 1]) for (const y of [1.9, 3.1, 4.35]) for (const dock of [4.3, 8]) {
    const plan = makePlan(direction, y, dock);
    const dt = 1e-6;
    applyArmPose(arm, sampleFastFling(plan, RELEASE_TIME - dt).pose);
    const before = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    applyArmPose(arm, sampleFastFling(plan, RELEASE_TIME).pose);
    const release = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    for (const axis of ['x', 'y', 'z']) {
      near(release[axis], plan.flight.origin[axis]);
      near((release[axis] - before[axis]) / dt, plan.flight.velocity[axis], 0.005);
    }
    assert.deepEqual(plan.flight.gravity, { x: 0, y: -9.81, z: 0 });
    near(plan.flight.duration, FLIGHT_DURATION);
    const landing = sampleFastFlight(plan.flight, FLIGHT_DURATION);
    assert.deepEqual(landing.position, plan.flight.destination);
    assert.ok(landing.velocity.y < 0);
    const apex = sampleFastFlight(plan.flight, FLIGHT_DURATION / 2);
    near(apex.position.y - release.y, 9.81 * FLIGHT_DURATION ** 2 / 8);
  }
});

test('grab, release, recoil, and rest join continuously with a fixed pedestal', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const base = arm.getObjectByName('base').matrixWorld.clone();
  for (const direction of [-1, 1]) for (const y of [1.9, 3.1, 4.35]) {
    const plan = makePlan(direction, y);
    assert.deepEqual(sampleFastFling(plan, 0).pose, REST_POSE);
    assert.equal(sampleFastFling(plan, GRIP_END - 1e-6).attached, false);
    assert.equal(sampleFastFling(plan, GRIP_END).pose.grip, 1);
    assert.equal(sampleFastFling(plan, RELEASE_TIME).pose.grip, 0);
    assert.equal(sampleFastFling(plan, RELEASE_TIME).attached, false);
    for (const boundary of [REACH_END, GRIP_END, RELEASE_TIME - 0.025, RELEASE_TIME, RECOIL_END, 1.12]) {
      const a = sampleFastFling(plan, boundary - 1e-7).pose;
      const b = sampleFastFling(plan, boundary + 1e-7).pose;
      for (const key of Object.keys(REST_POSE)) near(a[key], b[key], 1e-4);
    }
    for (let t = 0; t <= END_TIME; t += 0.005) {
      const { pose } = sampleFastFling(plan, t);
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(pose[key] >= min && pose[key] <= max);
      applyArmPose(arm, pose);
      assert.deepEqual(arm.getObjectByName('base').matrixWorld, base);
    }
    assert.deepEqual(sampleFastFling(plan, 1.12).pose, REST_POSE);
    assert.equal(sampleFastFling(plan, END_TIME).done, true);
  }
  near(LAND_TIME - RELEASE_TIME, FLIGHT_DURATION);
});

test('custom duration and interrupted starting pose remain deterministic', () => {
  const fromPose = solveMagneticPose(-1.5, 3.5, 1);
  const plan = createFastFling({ fromPose, flightDuration: 0.3 });
  for (const key of Object.keys(REST_POSE)) near(sampleFastFling(plan, 0).pose[key], fromPose[key]);
  assert.equal(plan.flight.duration, 0.3);
  const sample = sampleFastFling(plan, 0.5);
  sampleFastFling(plan, END_TIME);
  assert.deepEqual(sampleFastFling(plan, 0.5), sample);
  for (const t of [NaN, -1, 0, RELEASE_TIME, END_TIME, 100]) {
    for (const value of Object.values(sampleFastFling(plan, t).pose)) assert.ok(Number.isFinite(value));
  }
});
