import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { solveBoundedFollow } from './bounded-follow.js';
import { createArmModel } from './arm-model.js';
import { createExperienceFollow } from './experience-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { applyArmPose, REST_POSE } from './motion-study.js';
import { MAGNETIC_LIMITS } from './magnetic-follow.js';
import { portfolioFlowField } from './portfolio-field.js';
import { projectWorkspace, workspaceLayout } from './workspace-layout.js';

function fixture(composition, height = 440) {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const rig = createCameraStudyRig({ aspect: 1044 / height, armBounds: new THREE.Box3().setFromObject(arm) });
  const camera = new THREE.PerspectiveCamera(rig.fov, rig.aspect, rig.near, rig.far);
  camera.position.copy(rig.views.explore.position);
  camera.lookAt(rig.views.explore.target);
  camera.zoom = 1.28;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  const layout = { ...workspaceLayout(1044, height), homeShift: 200.5328, shift: -257.9528 };
  const field = portfolioFlowField({ layout, composition });
  const guard = createExperienceFollow({ arm, camera, restPose: { ...REST_POSE, yaw: 1.1 } });
  const resting = guard.safeRest(field);
  assert.ok(resting.safe);
  return { arm, camera, layout, field, guard, composition, idlePose: resting.pose };
}

function assertGeometryInside(context, pose) {
  const { arm, camera, layout, composition, field } = context;
  applyArmPose(arm, pose);
  const point = new THREE.Vector3();
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
      const pixel = projectWorkspace(point, camera, layout, composition);
      assert.ok(pixel.x >= field.viewport.left + field.halo && pixel.x <= field.viewport.right - field.halo);
      assert.ok(pixel.y >= field.viewport.top + field.halo && pixel.y <= field.viewport.bottom - field.halo);
    }
  });
}

test('vertical mouse sweeps outside either stage edge retain vertical motion through the real full-mesh guard', t => {
  for (const composition of [0, 1]) for (const x of [-100, 1144]) {
    const context = fixture(composition);
    let pose = context.idlePose;
    const points = [];
    for (const y of [80, 160, 240, 320, 400]) {
      const desired = solveBoundedFollow({ ...context, pixel: { x, y } });
      for (let frame = 0; frame < 70; frame++) {
        const candidate = Object.fromEntries(Object.keys(REST_POSE).map(key => [key, pose[key] + (desired[key] - pose[key]) * .16]));
        const result = context.guard.constrain({ ...context.field, fromPose: pose, candidatePose: candidate });
        assert.equal(result.startedUnsafe, false);
        assert.ok(result.safe);
        pose = result.pose;
      }
      assertGeometryInside(context, pose);
      points.push(projectWorkspace(context.arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()),
        context.camera, context.layout, composition));
    }
    const range = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
    assert.ok(range > 200, `composition ${composition}, x${x}: vertical range only ${range}px`);
    for (let index = 1; index < 4; index++) assert.ok(points[index].y - points[index - 1].y > 25,
      'An extreme horizontal target froze a subsequent vertical request');
    t.diagnostic(`composition ${composition}, x${x}: ${range.toFixed(1)}px vertical travel.`);
  }
});

test('bounded targets remain finite and continuous at the viewport edges and across the arm', () => {
  const context = fixture(0);
  for (const y of [80, 220, 390]) {
    let previous;
    for (let x = -200; x <= 1244; x += 4) {
      const pose = solveBoundedFollow({ ...context, pixel: { x, y } });
      for (const key of Object.keys(REST_POSE)) assert.ok(Number.isFinite(pose[key]));
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(pose[key] >= min && pose[key] <= max);
      // The existing idle dead zone intentionally returns its resting pose.
      const base = projectWorkspace(new THREE.Vector3(0, .85, 0), context.camera, context.layout, 0);
      if (previous && Math.hypot(x - base.x, y - base.y) > 58 && Math.hypot(x - 4 - base.x, y - base.y) > 58) {
        for (const key of ['yaw', 'shoulder', 'elbow', 'wrist']) assert.ok(Math.abs(pose[key] - previous[key]) < .3);
      }
      previous = pose;
    }
  }
  for (const pixel of [{ x: -1e6, y: 100 }, { x: 1e6, y: 350 }, { x: NaN, y: 20 }, null]) {
    const pose = solveBoundedFollow({ ...context, pixel });
    for (const key of Object.keys(REST_POSE)) assert.ok(Number.isFinite(pose[key]));
  }
  const base = projectWorkspace(new THREE.Vector3(0, .85, 0), context.camera, context.layout, 0);
  assert.deepEqual(solveBoundedFollow({ ...context, pixel: base }), context.idlePose);
});
