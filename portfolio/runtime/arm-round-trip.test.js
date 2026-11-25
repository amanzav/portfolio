import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmOnlyGesture, pointerMovedSinceLanding } from './arm-round-trip.js';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS, solveMagneticPose } from './magnetic-follow.js';
import { sampleFastFling, sampleFastFlight, GRIP_END, RELEASE_TIME, LAND_TIME, END_TIME } from './fast-fling.js';

const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, a + ' != ' + b);
function roundTrip(y, sourceSign) {
  const homePose = solveMagneticPose(sourceSign * 3.1, y, 0.5);
  const home = homePose.tip;
  const parked = { x: -home.x, y: home.y, z: home.z };
  const forward = createArmOnlyGesture({ fromPose: REST_POSE, reachPose: homePose, destination: parked });
  const forwardEnd = sampleFastFling(forward, END_TIME).pose;
  const parkedPose = solveMagneticPose(parked.x, parked.y, parked.z);
  const back = createArmOnlyGesture({ fromPose: forwardEnd, reachPose: parkedPose, destination: home });
  return { home, parked, forward, back, forwardEnd, parkedPose };
}

test('Neural search and LLM copilot use mirrored forward and Back world trajectories', () => {
  for (const y of [4.35, 1.9]) for (const sign of [-1, 1]) {
    const { home, parked, forward, back, forwardEnd } = roundTrip(y, sign);
    assert.deepEqual(sampleFastFling(back, 0).pose, forwardEnd);
    for (let time = GRIP_END; time < RELEASE_TIME; time += 0.001) {
      const a = sampleFastFling(forward, time).gripWorld;
      const b = sampleFastFling(back, time).gripWorld;
      near(a.x, -b.x);
      near(a.y, b.y);
      near(a.z, b.z);
      if (y < 2.6) near(a.y, home.y, 0.08);
    }
    for (let time = 0; time <= forward.flight.duration; time += 0.001) {
      const a = sampleFastFlight(forward.flight, time).position;
      const b = sampleFastFlight(back.flight, time).position;
      near(a.x, -b.x);
      near(a.y, b.y);
      near(a.z, b.z);
    }
    assert.deepEqual(sampleFastFlight(forward.flight, forward.flight.duration).position, parked);
    assert.deepEqual(sampleFastFlight(back.flight, back.flight.duration).position, home);
  }
});

test('actual gripper release velocity hands off to exact gravity flight in both directions', () => {
  const arm = createArmModel();
  for (const y of [4.35, 1.9]) for (const sign of [-1, 1]) {
    const { forward, back } = roundTrip(y, sign);
    for (const plan of [forward, back]) {
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
      assert.deepEqual(sampleFastFlight(plan.flight, plan.flight.duration).position, plan.flight.destination);
      near(plan.flight.duration, LAND_TIME - RELEASE_TIME);
      assert.equal(sampleFastFling(plan, GRIP_END).pose.grip, 1);
      assert.equal(sampleFastFling(plan, RELEASE_TIME).pose.grip, 0);
    }
  }
});

test('landing preserves facing, Back starts without a full turn, and the pedestal never moves', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const base = arm.getObjectByName('base').matrixWorld.clone();
  const root = arm.matrixWorld.clone();
  for (const y of [4.35, 1.9]) for (const sign of [-1, 1]) {
    const { forward, back, forwardEnd, parkedPose } = roundTrip(y, sign);
    near(parkedPose.yaw, forwardEnd.yaw);
    for (const plan of [forward, back]) {
      let previousYaw = null;
      const turnDirection = Math.sign(plan.settlePose.yaw - plan.releasePose.yaw);
      for (let time = 0; time <= END_TIME; time += 0.002) {
        const { pose } = sampleFastFling(plan, time);
        if (time >= RELEASE_TIME) {
          if (previousYaw !== null) assert.ok(turnDirection * (pose.yaw - previousYaw) >= -1e-7);
          previousYaw = pose.yaw;
        }
        if (time >= LAND_TIME) {
          const lowYaw = Math.min(plan.releasePose.yaw, plan.settlePose.yaw);
          const highYaw = Math.max(plan.releasePose.yaw, plan.settlePose.yaw);
          assert.ok(pose.yaw >= lowYaw - 0.001 && pose.yaw <= highYaw + 0.001);
        }
        for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(pose[key] >= min && pose[key] <= max);
        applyArmPose(arm, pose);
        assert.deepEqual(arm.getObjectByName('base').matrixWorld, base);
        assert.deepEqual(arm.matrixWorld, root);
      }
      assert.deepEqual(sampleFastFling(plan, END_TIME).pose, plan.settlePose);
    }
  }
});

test('magnetic follow waits for six pixels of fresh movement after landing', () => {
  const origin = { x: 100, y: 100 };
  assert.equal(pointerMovedSinceLanding(null, origin), false);
  assert.equal(pointerMovedSinceLanding(origin, origin), false);
  assert.equal(pointerMovedSinceLanding(origin, { x: 105.9, y: 100 }), false);
  assert.equal(pointerMovedSinceLanding(origin, { x: 106, y: 100 }), true);
  assert.equal(pointerMovedSinceLanding(origin, { x: 100, y: 94 }), true);
  assert.equal(pointerMovedSinceLanding(origin, { x: 103, y: 104 }), false);
  assert.equal(pointerMovedSinceLanding(origin, { x: 104, y: 105 }), true);
});
