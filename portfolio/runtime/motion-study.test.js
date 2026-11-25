import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { MOTION_DURATION, REST_POSE, applyArmPose, sampleMotion, getMotionBounds } from './motion-study.js';

test('moving the real hierarchy preserves rigid link lengths and the mirrored finger', () => {
  const arm = createArmModel();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i <= 120; i++) {
    applyArmPose(arm, sampleMotion(i / 120 * MOTION_DURATION));
    arm.getObjectByName('shoulder').getWorldPosition(a);
    arm.getObjectByName('elbow').getWorldPosition(b);
    arm.getObjectByName('wrist').getWorldPosition(c);
    assert.ok(Math.abs(a.distanceTo(b) - 2.15) < 1e-9);
    assert.ok(Math.abs(b.distanceTo(c) - 2.05) < 1e-9);
    assert.equal(arm.getObjectByName('fingerLower').scale.y, -1);
  }
});

test('scrubbing backward and replaying returns every mesh to its original transform', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const baseline = new Map();
  arm.traverse(mesh => { if (mesh.isMesh) baseline.set(mesh, mesh.matrixWorld.clone()); });
  for (const time of [4.1, 9.7, 1.2, 6.5, MOTION_DURATION]) applyArmPose(arm, sampleMotion(time));
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.matrixWorld.elements.forEach((value, index) => assert.ok(Math.abs(value - baseline.get(mesh).elements[index]) < 1e-9));
  });
});

test('sampled camera bounds contain the motion with the viewer framing margin', () => {
  const arm = createArmModel();
  const bounds = getMotionBounds(arm).expandByScalar(0.025);
  for (let i = 0; i <= 240; i++) {
    applyArmPose(arm, sampleMotion(i / 240 * MOTION_DURATION));
    assert.ok(bounds.containsBox(new THREE.Box3().setFromObject(arm)));
  }
});
