import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDragPlace, sampleDragPlace } from './drag-place.js';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS } from './magnetic-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { configureExperienceWorkspace } from './experience-workspace.js';
import { workspaceLayout, workspaceGrip, projectWorkspace } from './workspace-layout.js';

const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const arm = createArmModel();
applyArmPose(arm, REST_POSE);
const baseMatrix = arm.getObjectByName('base').matrixWorld.toArray();
const rig = createCameraStudyRig({ aspect: 1044 / 432, armBounds: new THREE.Box3().setFromObject(arm) });
const camera = new THREE.PerspectiveCamera(rig.fov, 1044 / 432, rig.near, rig.far);
camera.position.copy(rig.views.explore.position);
camera.lookAt(rig.views.explore.target);
camera.updateMatrixWorld(true);
const { layout, anchors, reading } = configureExperienceWorkspace({ camera, layout: workspaceLayout(1044, 432) });
const cases = [];
for (const note of anchors) {
  const headingPixel = { x: reading.summaryLeft + [271.05, 283.36, 297.71][note.index], y: layout.summaryTop + 15 };
  cases.push({ name: `forward ${note.index}`, composition: 0,
    pickup: workspaceGrip({ x: note.x, y: note.y - 6 }, camera, layout, 0),
    place: workspaceGrip(headingPixel, camera, layout, 0), pixel: headingPixel });
  const homePixel = { x: note.left, y: note.y };
  cases.push({ name: `Back ${note.index}`, composition: 1,
    pickup: workspaceGrip({ x: reading.summaryLeft, y: layout.summaryTop + 15 }, camera, layout, 1),
    place: workspaceGrip(homePixel, camera, layout, 1), pixel: homePixel });
}
for (const [index, width] of [43.08, 76.31, 32].entries()) {
  const pixel = { x: reading.summaryLeft + width * 13 / 16, y: layout.summaryTop + 30 + 8 + 18.85 / 2 };
  cases.push({ name: `index ${index}`, composition: 1,
    pickup: workspaceGrip({ x: reading.indexEdge + width, y: layout.listTop + index * reading.indexStep - 2 }, camera, layout, 1),
    place: workspaceGrip(pixel, camera, layout, 1), pixel });
}

test('all nine placements remain physically held until exact screen contact and stop before the jaws open', () => {
  for (const item of cases) {
    const plan = createDragPlace({ fromPose: REST_POSE, reachPose: item.pickup.pose, placePose: item.place.pose });
    for (let i = 0; i <= 100; i++) {
      const time = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * i / 100;
      const state = sampleDragPlace(plan, time);
      assert.equal(state.attached, true);
      near(state.pose.grip, 1);
      applyArmPose(arm, state.pose);
      const actual = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
      for (const axis of ['x', 'y', 'z']) near(actual[axis], state.gripWorld[axis]);
    }
    const placed = sampleDragPlace(plan, plan.landTime);
    const point = projectWorkspace(new THREE.Vector3(placed.gripWorld.x, placed.gripWorld.y, placed.gripWorld.z), camera, layout, item.composition);
    near(point.x, item.pixel.x, 0.05); near(point.y, item.pixel.y, 0.05);
    const before = sampleDragPlace(plan, plan.landTime - 1e-5).gripWorld;
    for (const axis of ['x', 'y', 'z']) near((placed.gripWorld[axis] - before[axis]) / 1e-5, 0, 1e-5);
    const opening = sampleDragPlace(plan, (plan.timing.placeTime + plan.timing.releaseTime) / 2);
    for (const axis of ['x', 'y', 'z']) near(opening.gripWorld[axis], placed.gripWorld[axis]);
    assert.ok(opening.pose.grip > 0 && opening.pose.grip < 1);
    assert.equal(sampleDragPlace(plan, plan.timing.releaseTime).attached, false);
  }
});

test('minimum-jerk joint dynamics remain continuous, bounded, grounded, deterministic and without overshoot', t => {
  let floorClearance = Infinity;
  for (const item of cases) {
    const plan = createDragPlace({ fromPose: REST_POSE, reachPose: item.pickup.pose, placePose: item.place.pose });
    for (const boundary of Object.values(plan.timing)) {
      const before = sampleDragPlace(plan, boundary - 1e-7).pose;
      const after = sampleDragPlace(plan, boundary + 1e-7).pose;
      for (const key of Object.keys(REST_POSE)) near(before[key], after[key], 1e-5);
    }
    for (let i = 0; i <= 150; i++) {
      const state = sampleDragPlace(plan, plan.endTime * i / 150);
      applyArmPose(arm, state.pose);
      assert.deepEqual(arm.getObjectByName('base').matrixWorld.toArray(), baseMatrix);
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(state.pose[key] >= min && state.pose[key] <= max);
      const wrist = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
      floorClearance = Math.min(floorClearance, wrist.min.y);
      assert.ok(wrist.min.y > 0.1, item.name);
      if (state.phase === 'drag') for (const key of ['shoulder', 'elbow', 'wrist', 'yaw']) {
        assert.ok(state.pose[key] >= Math.min(plan.reachPose[key], plan.placePose[key]) - 1e-9);
        assert.ok(state.pose[key] <= Math.max(plan.reachPose[key], plan.placePose[key]) + 1e-9);
      }
    }
    assert.deepEqual(sampleDragPlace(plan, 0.4), sampleDragPlace(plan, 0.4));
    assert.deepEqual(sampleDragPlace(plan, NaN), sampleDragPlace(plan, 0));
    assert.equal(sampleDragPlace(plan, plan.endTime).done, true);
    for (const key of ['shoulder', 'elbow', 'wrist']) near(plan.nextPose[key], plan.placePose[key]);
  }
  t.diagnostic(`Lowest wrist/jaw mesh bound during all nine actions: ${floorClearance.toFixed(3)} above the floor.`);
});

test('a supplied empty-hand next pose starts only after release and ends exactly without a reset', () => {
  const item = cases[0];
  const nextPose = { ...item.place.pose, yaw: 1.1 };
  const plan = createDragPlace({ fromPose: REST_POSE, reachPose: item.pickup.pose, placePose: item.place.pose, nextPose });
  const before = sampleDragPlace(plan, plan.timing.releaseTime - 1e-7);
  near(before.pose.yaw, plan.placePose.yaw);
  const end = sampleDragPlace(plan, plan.endTime);
  near(end.pose.yaw, 1.1);
  assert.equal(end.pose.grip, 0);
  assert.equal(end.placed, true);
  assert.equal(end.attached, false);
});
