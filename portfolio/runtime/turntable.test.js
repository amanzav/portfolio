import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { applyArmPose } from './motion-study.js';
import { solveMagneticPose, magneticTurnDepth } from './magnetic-follow.js';

test('the elbow stays above shoulder and wrist on both sides of a horizontal reach', () => {
  const arm = createArmModel();
  for (const x of [-3.5, -3, -2.5, 2.5, 3, 3.5]) {
    for (const y of [2.2, 2.6, 3]) {
      applyArmPose(arm, solveMagneticPose(x, y, 0));
      const elbow = arm.getObjectByName('elbow').getWorldPosition(new THREE.Vector3());
      const shoulder = arm.getObjectByName('shoulder').getWorldPosition(new THREE.Vector3());
      const wrist = arm.getObjectByName('wrist').getWorldPosition(new THREE.Vector3());
      assert.ok(elbow.y > shoulder.y + 0.3);
      assert.ok(elbow.y > wrist.y + 0.15);
    }
  }
});

test('turning through depth preserves the magnetic screen target in an oblique camera', () => {
  const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 80);
  camera.position.set(4.3, 5.1, 16);
  camera.lookAt(0, 2.7, 0);
  camera.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const target = new THREE.Vector3();
  let checked = 0;
  for (const x of [-0.35, -0.2, -0.05, 0, 0.05, 0.2, 0.35]) {
    const cursor = new THREE.Vector2(x, 0.28);
    ray.setFromCamera(cursor, camera);
    plane.constant = 0;
    ray.ray.intersectPlane(plane, target);
    const depth = magneticTurnDepth(target.x);
    plane.constant = -depth;
    ray.ray.intersectPlane(plane, target);
    const pose = solveMagneticPose(target.x, target.y, depth);
    if (pose.clamped) continue;
    const projected = new THREE.Vector3(pose.tip.x, pose.tip.y, pose.tip.z).project(camera);
    assert.ok(Math.abs(projected.x - cursor.x) < 1e-9);
    assert.ok(Math.abs(projected.y - cursor.y) < 1e-9);
    checked++;
  }
  assert.ok(checked >= 5, 'not enough reachable targets exercised the forward turn');
});
