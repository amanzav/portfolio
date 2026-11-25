import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCameraStudyRig, sampleCameraStudy } from './camera-rig.js';

function cameraFor(rig, pose) {
  const camera = new THREE.PerspectiveCamera(rig.fov, rig.aspect, rig.near, rig.far);
  camera.position.copy(pose.position);
  camera.lookAt(pose.target);
  camera.updateMatrixWorld();
  return camera;
}
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('mirrored read views center their docks and place the arm at fifteen/eighty-five percent', () => {
  for (const aspect of [1044 / 520, 1044 / 440, 1.5, 2.7]) {
    const rig = createCameraStudyRig({ aspect });
    const center = new THREE.Vector3(0.01, 2.215, 0);
    for (const [view, side, expected] of [['readRight', 'right', -0.7], ['readLeft', 'left', 0.7]]) {
      const camera = cameraFor(rig, rig.views[view]);
      const dock = rig.docks[side].clone().project(camera);
      near(dock.x, 0);
      near(dock.y, 0);
      near(center.clone().project(camera).x, expected);
      for (const x of [-1.66, 1.68]) for (const y of [0, 4.43]) for (const z of [-0.75, 0.75]) {
        const point = new THREE.Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(point.x) < 0.95 && Math.abs(point.y) < 0.9);
      }
    }
  }
});

test('explore frames both the whole arm and room for the six text choices', () => {
  const rig = createCameraStudyRig({ aspect: 1044 / 520 });
  const camera = cameraFor(rig, rig.views.explore);
  for (const x of [-4.9, 4.9]) for (const y of [-0.08, 5.15]) for (const z of [-0.8, 0.8]) {
    const point = new THREE.Vector3(x, y, z).project(camera);
    assert.ok(Math.abs(point.x) <= 0.88 + 1e-8 && Math.abs(point.y) <= 0.88 + 1e-8);
  }
});

test('camera rail preserves its endpoints and accepts a live pose for interruption', () => {
  const rig = createCameraStudyRig({ aspect: 2 });
  assert.deepEqual(sampleCameraStudy(rig, 'explore', 'readRight', 0), rig.views.explore);
  assert.deepEqual(sampleCameraStudy(rig, 'explore', 'readRight', 1), rig.views.readRight);
  const live = sampleCameraStudy(rig, 'explore', 'readRight', 0.42);
  assert.deepEqual(sampleCameraStudy(rig, live, 'explore', 0), live);
  const again = sampleCameraStudy(rig, 'explore', 'readRight', 0.42);
  assert.deepEqual(live, again);
  assert.notEqual(live.position, rig.views.explore.position);
});

test('all camera rail samples keep the arm in frame with a level horizon', () => {
  const rig = createCameraStudyRig({ aspect: 1044 / 520 });
  for (const view of ['readLeft', 'readRight']) for (let i = 0; i <= 100; i++) {
    const pose = sampleCameraStudy(rig, 'explore', view, i / 100);
    const camera = cameraFor(rig, pose);
    near(camera.up.x, 0);
    near(camera.up.y, 1);
    near(camera.up.z, 0);
    for (const x of [-1.66, 1.68]) for (const y of [0, 4.43]) for (const z of [-0.75, 0.75]) {
      const point = new THREE.Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
    }
  }
});
