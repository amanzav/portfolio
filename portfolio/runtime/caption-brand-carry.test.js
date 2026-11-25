import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { applyArmPose, REST_POSE } from './motion-study.js';
import { MAGNETIC_LIMITS } from './magnetic-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { workspaceLayout, workspaceGrip, projectWorkspace } from './workspace-layout.js';
import { createCarryWorkspace, readyPoseFacingPlace } from './carry-workspace.js';
import { createCaptionCarryWorkspace, sampleCaptionCarryWorkspace } from './caption-carry.js';

const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected} by more than ${tolerance}`);
const arm = createArmModel();
applyArmPose(arm, REST_POSE);
const rig = createCameraStudyRig({ aspect: 1044 / 440, armBounds: new THREE.Box3().setFromObject(arm) });
const camera = new THREE.PerspectiveCamera(rig.fov, rig.aspect, rig.near, rig.far);
camera.position.copy(rig.views.explore.position);
camera.lookAt(rig.views.explore.target);
camera.zoom = 1.28;
camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
const layout = { ...workspaceLayout(1044, 440), homeShift: 200.5328, shift: -257.9528 };
const labelWidths = [40, 68, 27], iconWidths = [16, 16, 23];
const ready = [710, 730, 750].map(x => readyPoseFacingPlace(workspaceGrip({ x, y: layout.summaryTop + 15 }, camera, layout, 1).pose));
const baseMatrix = arm.matrixWorld.toArray();

function options(selected, incoming, left, dx = 0, dy = 0) {
  return { camera, layout, fromPose: ready[selected],
    sourcePixel: { x: left + iconWidths[incoming] / 2, y: 56 },
    destinationPixel: { x: layout.summaryLeft + 9 + dx, y: layout.summaryTop + 52 + dy },
    fromComposition: 1, toComposition: 1 };
}

test('all packed brand captions grip their stationary real icon and carry exactly across every summary offset', t => {
  let actions = 0, shortened = 0, maximumError = 0, floor = Infinity;
  for (let selected = 0; selected < 3; selected++) {
    let left = layout.summaryLeft;
    for (let incoming = 0; incoming < 3; incoming++) {
      if (incoming === selected) continue;
      for (const dx of [-18, 0, 24]) for (const dy of [-6, 0, 6]) {
        const configuration = options(selected, incoming, left, dx, dy);
        const originalSource = { ...configuration.sourcePixel };
        const originalDestination = { ...configuration.destinationPixel };
        const initial = createCarryWorkspace(configuration);
        const plan = createCaptionCarryWorkspace(configuration);
        shortened += Number(plan.depthRise < initial.depthRise - 1e-6);
        assert.deepEqual(configuration.sourcePixel, originalSource);
        assert.deepEqual(plan.sourcePixel, originalSource);
        assert.deepEqual(plan.destinationPixel, originalDestination);
        assert.deepEqual(plan.timing, initial.timing);
        for (let index = 0; index <= 180; index++) {
          const time = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / 180;
          const state = sampleCaptionCarryWorkspace(plan, time);
          assert.equal(state.attached, true);
          near(state.pose.grip, 1);
          near(state.composition, 1);
          applyArmPose(arm, state.pose);
          const tip = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
          const pixel = projectWorkspace(tip, camera, layout, 1);
          maximumError = Math.max(maximumError, Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y));
          assert.ok(maximumError < .02, `Actual gripper left the carried brand by ${maximumError}px`);
          for (const axis of ['x', 'y', 'z']) near(tip[axis], state.gripWorld[axis]);
          for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) {
            assert.ok(Number.isFinite(state.pose[key]) && state.pose[key] >= min && state.pose[key] <= max);
          }
          assert.deepEqual(arm.matrixWorld.toArray(), baseMatrix);
          const bounds = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
          floor = Math.min(floor, bounds.min.y);
          assert.ok(bounds.min.y > .1);
        }
        for (const time of [plan.timing.reachEnd, (plan.timing.reachEnd + plan.timing.gripEnd) / 2, plan.timing.gripEnd]) {
          const frame = sampleCaptionCarryWorkspace(plan, time);
          const actual = projectWorkspace(new THREE.Vector3(frame.gripWorld.x, frame.gripWorld.y, frame.gripWorld.z), camera, layout, 1);
          near(actual.x, originalSource.x, .02); near(actual.y, originalSource.y, .02);
        }
        for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime, plan.timing.releaseTime, plan.timing.turnEnd]) {
          const before = sampleCaptionCarryWorkspace(plan, boundary - 1e-7).pose;
          const after = sampleCaptionCarryWorkspace(plan, boundary + 1e-7).pose;
          for (const key of Object.keys(REST_POSE)) near(before[key], after[key], .001);
        }
        actions++;
      }
      left += labelWidths[incoming] + iconWidths[incoming] + 7 + 24;
    }
  }
  assert.equal(actions, 54);
  assert.ok(shortened > 0, 'The test did not exercise the shorter-depth fallback');
  t.diagnostic(`${actions} stationary-source actions, ${shortened} shorter arcs; actual contact error ${maximumError.toFixed(8)}px, wrist clearance ${floor.toFixed(3)}.`);
});

test('already feasible caption trajectories stay unchanged and impossible word-center pickups stay rejected', () => {
  const configuration = options(0, 1, layout.summaryLeft);
  const initial = createCarryWorkspace(configuration);
  const plan = createCaptionCarryWorkspace(configuration);
  near(plan.depthRise, initial.depthRise);
  near(plan.captionVerticalLead, 0);
  assert.throws(() => createCaptionCarryWorkspace({ ...configuration, sourcePixel: { x: 826.66, y: 56 } }),
    /outside the visible gripper workspace/);
});
