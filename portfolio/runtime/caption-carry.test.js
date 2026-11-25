import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCaptionCarryWorkspace, sampleCaptionCarryWorkspace } from './caption-carry.js';
import { createCarryWorkspace, sampleCarryWorkspace, readyPoseFacingPlace } from './carry-workspace.js';
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
camera.zoom = 1.25;
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);
const cameraMatrix = camera.matrixWorld.toArray();
const { layout } = configureExperienceWorkspace({ camera, layout: workspaceLayout(1044, 432) });
const headingPixels = [271.05, 283.36, 297.71].map(width => ({ x: layout.summaryLeft + width / 2, y: layout.summaryTop + 15 }));
const readyPoses = headingPixels.map(pixel => readyPoseFacingPlace(workspaceGrip(pixel, camera, layout, 1).pose));

function options(index, slot, previous = (index + 1) % 3) {
  return { camera, layout, fromPose: readyPoses[previous],
    sourcePixel: { x: 139.859375, y: [178.640625, 308.640625][slot] },
    destinationPixel: headingPixels[index], readyPixel: headingPixels[index],
    fromComposition: 1, toComposition: 1, gripFraction: 0.5 };
}

function maximumContactError(plan, samples = 250) {
  let maximum = 0;
  for (let index = 0; index <= samples; index++) {
    const state = sampleCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / samples);
    const pixel = projectWorkspace(new THREE.Vector3(state.gripWorld.x, state.gripWorld.y, state.gripWorld.z), camera, layout, state.composition);
    maximum = Math.max(maximum, Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y));
  }
  return maximum;
}

test('both wrapped-title slots have exact endpoints but the lower slot needs additional front depth rather than less', () => {
  for (let index = 0; index < 3; index++) for (let slot = 0; slot < 2; slot++) {
    const config = options(index, slot);
    assert.ok(workspaceGrip(config.sourcePixel, camera, layout, 1).error < 0.05);
    assert.ok(workspaceGrip(config.destinationPixel, camera, layout, 1).error < 0.05);
    const initial = createCarryWorkspace(config);
    const originalError = maximumContactError(initial);
    const tuned = createCaptionCarryWorkspace(config);
    assert.ok(maximumContactError(tuned) < 0.05);
    assert.deepEqual(tuned.timing, initial.timing);
    if (slot === 0) near(tuned.depthRise, initial.depthRise);
    else {
      assert.ok(originalError > 1);
      assert.ok(tuned.depthRise > initial.depthRise && tuned.depthRise <= initial.depthRise + 1);
      initial.depthRise = 0;
      assert.ok(maximumContactError(initial) > originalError);
    }
  }
});

test('all three wrapped titles carry exactly from both slots and either previous ready pose without layout, floor or timing regressions', t => {
  let maximumError = 0, floor = Infinity;
  for (let index = 0; index < 3; index++) for (let slot = 0; slot < 2; slot++) for (let previous = 0; previous < 3; previous++) {
    if (previous === index) continue;
    const plan = createCaptionCarryWorkspace(options(index, slot, previous));
    for (let sample = 0; sample <= 250; sample++) {
      const state = sampleCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * sample / 250);
      assert.equal(state.attached, true);
      near(state.pose.grip, 1);
      near(state.composition, 1);
      applyArmPose(arm, state.pose);
      const actual = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
      for (const axis of ['x', 'y', 'z']) near(actual[axis], state.gripWorld[axis]);
      const pixel = projectWorkspace(actual, camera, layout, 1);
      const error = Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y);
      maximumError = Math.max(maximumError, error);
      assert.ok(error < 0.05);
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(state.pose[key] >= min && state.pose[key] <= max);
      assert.deepEqual(arm.getObjectByName('base').matrixWorld.toArray(), baseMatrix);
    }
    for (let sample = 0; sample <= 100; sample++) {
      applyArmPose(arm, sampleCarryWorkspace(plan, plan.endTime * sample / 100).pose);
      const wrist = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
      floor = Math.min(floor, wrist.min.y);
      assert.ok(wrist.min.y > 0.1);
    }
    for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime, plan.timing.releaseTime, plan.timing.turnEnd]) {
      const a = sampleCarryWorkspace(plan, boundary - 1e-7).pose;
      const b = sampleCarryWorkspace(plan, boundary + 1e-7).pose;
      for (const key of Object.keys(REST_POSE)) near(a[key], b[key], 0.001);
    }
    const end = sampleCarryWorkspace(plan, plan.endTime);
    near(end.pose.yaw, plan.placePose.yaw);
  }
  assert.deepEqual(camera.matrixWorld.toArray(), cameraMatrix);
  t.diagnostic(`12 actual-ready-pose actions: maximum held error ${maximumError.toFixed(6)}px, minimum wrist/jaw floor clearance ${floor.toFixed(3)}.`);
});

test('lower caption clicks remain reachable in taller laptop stages', () => {
  for (const height of [500, 540]) {
    applyArmPose(arm, REST_POSE);
    const nextRig = createCameraStudyRig({ aspect: 1044 / height, armBounds: new THREE.Box3().setFromObject(arm) });
    const nextCamera = new THREE.PerspectiveCamera(nextRig.fov, 1044 / height, nextRig.near, nextRig.far);
    nextCamera.position.copy(nextRig.views.explore.position);
    nextCamera.lookAt(nextRig.views.explore.target);
    nextCamera.zoom = 1.25;
    nextCamera.updateProjectionMatrix();
    nextCamera.updateMatrixWorld(true);
    const { layout: nextLayout } = configureExperienceWorkspace({ camera: nextCamera, layout: workspaceLayout(1044, height) });
    for (const width of [271.05, 283.36, 297.71]) {
      const destinationPixel = { x: nextLayout.summaryLeft + width / 2, y: nextLayout.summaryTop + 15 };
      const fromPose = readyPoseFacingPlace(workspaceGrip(destinationPixel, nextCamera, nextLayout, 1).pose);
      const plan = createCaptionCarryWorkspace({ camera: nextCamera, layout: nextLayout, fromPose,
        sourcePixel: { x: 139.859375, y: height * 250 / 432 + 58.640625 },
        destinationPixel, fromComposition: 1, toComposition: 1 });
      for (let sample = 0; sample <= 240; sample++) {
        const state = sampleCaptionCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * sample / 240);
        const pixel = projectWorkspace(new THREE.Vector3(state.gripWorld.x, state.gripWorld.y, state.gripWorld.z), nextCamera, nextLayout, 1);
        assert.ok(Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y) < 0.05);
        applyArmPose(arm, state.pose);
        assert.ok(new THREE.Box3().setFromObject(arm.getObjectByName('wrist')).min.y > 0.1);
        for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(state.pose[key] >= min && state.pose[key] <= max);
      }
      for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime]) {
        const before = sampleCaptionCarryWorkspace(plan, boundary - 1e-7).pose;
        const after = sampleCaptionCarryWorkspace(plan, boundary + 1e-7).pose;
        for (const key of Object.keys(REST_POSE)) near(before[key], after[key], 0.001);
      }
    }
  }
});
