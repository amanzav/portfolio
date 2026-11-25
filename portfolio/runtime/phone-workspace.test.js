import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { configurePhoneWorkspace, phoneTitleDock } from './phone-workspace.js';
import { createHomeCarryWorkspace } from './home-carry.js';
import { sampleCarryWorkspace } from './carry-workspace.js';
import { projectWorkspace } from './workspace-layout.js';
import { createArmModel } from './arm-model.js';
import { applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS } from './magnetic-follow.js';

const WIDTHS = [280, 320, 350, 390, 560];
const HEIGHTS = [620, 780, 1120];
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected}`);

function projectedBounds(arm, workspace) {
  const result = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const point = projectWorkspace(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld), workspace.camera, workspace.layout, 0);
      result.left = Math.min(result.left, point.x); result.right = Math.max(result.right, point.x);
      result.top = Math.min(result.top, point.y); result.bottom = Math.max(result.bottom, point.y);
    }
  });
  return result;
}

test('phone crop keeps the arm above a full-width summary as document height changes', () => {
  const arm = createArmModel();
  for (const width of WIDTHS) {
    let baseline;
    for (const height of HEIGHTS) {
      const workspace = configurePhoneWorkspace({ width, height, topInset: 0 });
      applyArmPose(arm, workspace.restPose);
      const bounds = projectedBounds(arm, workspace);
      assert.ok(bounds.left >= 14 && bounds.right <= width - 14);
      assert.ok(bounds.top >= workspace.layout.topInset + 14);
      assert.ok(bounds.right - bounds.left >= 160 && bounds.right - bounds.left <= 180);
      assert.ok(bounds.bottom - bounds.top >= 220 && bounds.bottom - bounds.top <= 260);
      assert.ok(workspace.layout.summaryTop - bounds.bottom >= 30);
      assert.equal(workspace.layout.summaryLeft, 0);
      assert.equal(workspace.layout.summaryWidth, width);
      if (baseline) for (const key of Object.keys(bounds)) near(bounds[key], baseline[key]);
      baseline = bounds;
    }
  }
});

test('phone title pickup and return maintain physical contact for both font sizes and glyph offsets', () => {
  const arm = createArmModel();
  for (const width of WIDTHS) for (const height of HEIGHTS) {
    const workspace = configurePhoneWorkspace({ width, height, topInset: 0 });
    applyArmPose(arm, workspace.restPose);
    const base = arm.getObjectByName('base').matrixWorld.toArray();
    for (const homeWidth of [153, 198, 250.2]) for (const offset of [-7, 0, 7]) {
      const home = phoneTitleDock(workspace, { width: homeWidth, height: 22.5 });
      const heading = phoneTitleDock(workspace, { width: homeWidth * 20 / 18, height: 25 });
      const sourcePixel = { x: home.x + offset, y: home.y };
      const destinationPixel = { x: heading.placementContact.x + offset * 20 / 18, y: heading.placementContact.y };
      const forward = createHomeCarryWorkspace({ ...workspace, fromPose: workspace.restPose, sourcePixel, destinationPixel });
      const backward = createHomeCarryWorkspace({ ...workspace, fromPose: forward.nextPose,
        sourcePixel: destinationPixel, destinationPixel: sourcePixel, fromComposition: 1, toComposition: 0 });
      for (const plan of [forward, backward]) {
        for (let index = 0; index <= 160; index++) {
          const seconds = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / 160;
          const frame = sampleCarryWorkspace(plan, seconds);
          applyArmPose(arm, frame.pose);
          const actualGrip = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
          const pixel = projectWorkspace(actualGrip, workspace.camera, workspace.layout, frame.composition);
          assert.ok(Math.hypot(pixel.x - frame.screen.x, pixel.y - frame.screen.y) <= 0.02,
            `Lost contact at ${width}×${height}, title ${homeWidth}, glyph offset ${offset}, sample ${index}`);
          assert.deepEqual(arm.getObjectByName('base').matrixWorld.toArray(), base);
          for (const [joint, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(frame.pose[joint] >= min && frame.pose[joint] <= max);
        }
      }
    }
  }
});

test('phone camera reconfiguration replaces existing zoom and crop', () => {
  const camera = new THREE.PerspectiveCamera(50, 2, 1, 20);
  camera.zoom = 1.28;
  camera.setViewOffset(500, 400, 60, 40, 200, 300);
  const workspace = configurePhoneWorkspace({ camera, width: 350, height: 900 });
  assert.equal(workspace.camera, camera);
  assert.equal(camera.zoom, 1);
  assert.equal(camera.view.fullWidth, 350);
  assert.equal(camera.view.fullHeight, 320);
  assert.equal(camera.view.height, 900);
  assert.equal(camera.view.offsetX, 0);
  assert.equal(camera.view.offsetY, -44);
  assert.throws(() => configurePhoneWorkspace({ width: 350, height: 100 }));
  assert.throws(() => phoneTitleDock(workspace, { width: 200, height: 25, gripFraction: 2 }));
});
