import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { chooseHomeGripFraction, createHomeCarryWorkspace } from './home-carry.js';
import { createCarryWorkspace, sampleCarryWorkspace, readyPoseFacingPlace } from './carry-workspace.js';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { createCameraStudyRig } from './camera-rig.js';
import { configureExperienceWorkspace } from './experience-workspace.js';
import { workspaceLayout, workspaceGrip, projectWorkspace } from './workspace-layout.js';

const widths = [238.765625, 232.265625, 186.3984375];
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

function fixture(height) {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const rig = createCameraStudyRig({ aspect: 1044 / height, armBounds: new THREE.Box3().setFromObject(arm) });
  const camera = new THREE.PerspectiveCamera(rig.fov, 1044 / height, rig.near, rig.far);
  camera.position.copy(rig.views.explore.position);
  camera.lookAt(rig.views.explore.target);
  camera.zoom = 1.25;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { arm, camera, ...configureExperienceWorkspace({ camera, layout: workspaceLayout(1044, height), titleWidths: widths }) };
}

test('the approved shorter Boomerang title reproduces the old center-grip Overview failure', () => {
  const { camera, layout, anchors } = fixture(432);
  const sourcePixel = { x: layout.summaryLeft + widths[1] * 24 / 22 / 2, y: layout.summaryTop + 15 };
  const destinationPixel = { x: anchors[1].left + widths[1] / 2, y: anchors[1].y };
  assert.throws(() => createCarryWorkspace({ camera, layout, fromPose: REST_POSE, sourcePixel, destinationPixel,
    fromComposition: 1, toComposition: 0 }), /outside the visible gripper workspace/);
});

test('all approved titles keep exact Home and Overview contact at short and tall laptop stage heights', t => {
  let count = 0, maximumError = 0;
  for (const height of [432, 540]) {
    const { arm, camera, layout, anchors } = fixture(height);
    const fractions = [];
    for (const [index, width] of widths.entries()) {
      const home = { left: anchors[index].left, width, y: anchors[index].y };
      const heading = { left: layout.summaryLeft, width: width * 24 / 22, y: layout.summaryTop + 15 };
      const fraction = chooseHomeGripFraction({ camera, layout, home, heading });
      fractions.push(fraction);
      const headingPixel = { x: heading.left + heading.width * fraction, y: heading.y };
      const ready = readyPoseFacingPlace(workspaceGrip(headingPixel, camera, layout, 1).pose);
      for (const offset of [-9, 0, 3]) for (const opening of [true, false]) {
        const homePixel = { x: home.left + home.width * fraction, y: home.y + (opening ? offset : 0) };
        const sourcePixel = opening ? homePixel : headingPixel;
        const destinationPixel = opening ? headingPixel : homePixel;
        const plan = createHomeCarryWorkspace({ camera, layout, fromPose: opening ? REST_POSE : ready,
          sourcePixel, destinationPixel, fromComposition: opening ? 0 : 1, toComposition: opening ? 1 : 0, gripFraction: fraction });
        if (!opening) near(plan.fromPose.yaw, plan.reachPose.yaw);
        for (let sample = 0; sample <= 180; sample++) {
          const state = sampleCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * sample / 180);
          assert.equal(state.attached, true);
          near(state.pose.grip, 1);
          applyArmPose(arm, state.pose);
          const actual = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
          const pixel = projectWorkspace(actual, camera, layout, state.composition);
          const error = Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y);
          maximumError = Math.max(maximumError, error);
          assert.ok(error < 0.05);
          assert.ok(new THREE.Box3().setFromObject(arm.getObjectByName('wrist')).min.y > 0.1);
        }
        const placed = sampleCarryWorkspace(plan, plan.landTime);
        const actual = projectWorkspace(new THREE.Vector3(placed.gripWorld.x, placed.gripWorld.y, placed.gripWorld.z), camera, layout, plan.toComposition);
        near(actual.x, destinationPixel.x, 0.05); near(actual.y, destinationPixel.y, 0.05);
        for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime]) {
          const a = sampleCarryWorkspace(plan, boundary - 1e-7).pose;
          const b = sampleCarryWorkspace(plan, boundary + 1e-7).pose;
          for (const key of Object.keys(REST_POSE)) near(a[key], b[key], 0.001);
        }
        count++;
      }
    }
    if (height === 432) assert.deepEqual(fractions, [0.55, 0.55, 0.75]);
    else assert.deepEqual(fractions, [0.5, 0.5, 0.5]);
    t.diagnostic(`${height}px stage grip fractions: ${fractions.join(', ')}.`);
  }
  t.diagnostic(`${count} Home/Overview paths; maximum actual contact error ${maximumError.toFixed(6)}px.`);
});
