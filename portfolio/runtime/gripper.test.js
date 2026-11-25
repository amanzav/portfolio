import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { applyArmPose, REST_POSE } from './motion-study.js';

function padCenters(arm) {
  const gripper = arm.getObjectByName('gripper');
  return ['gripPadUpper', 'gripPadLower'].map(name =>
    gripper.worldToLocal(arm.getObjectByName(name).getWorldPosition(new THREE.Vector3())));
}

function padGap(arm) {
  const [upper, lower] = padCenters(arm);
  return upper.y - lower.y - 0.036;
}

test('hinged fingers close the visible pad gap without pad penetration', () => {
  const arm = createArmModel();
  applyArmPose(arm, { ...REST_POSE, grip: 0 });
  const openGap = padGap(arm);
  applyArmPose(arm, { ...REST_POSE, grip: 1 });
  const closedGap = padGap(arm);
  assert.ok(closedGap > 0 && closedGap <= 0.065, `Closed gap: ${closedGap}`);
  assert.ok(closedGap <= openGap * 0.15);
  const [upper, lower] = padCenters(arm);
  assert.ok(Math.abs(upper.y + lower.y) < 1e-10);
  assert.ok(Math.abs(upper.x - lower.x) < 1e-10);
});

test('hinges rotate in opposite directions and grip clamps safely', () => {
  const arm = createArmModel();
  for (const [input, expected] of [[-1, 0], [0.5, 0.5], [2, 1], [NaN, 0]]) {
    applyArmPose(arm, { ...REST_POSE, grip: input });
    assert.equal(arm.getObjectByName('fingerUpper').rotation.z, -0.54 * expected);
    assert.equal(arm.getObjectByName('fingerLower').rotation.z, 0.54 * expected);
    assert.equal(arm.getObjectByName('gripPadUpper').rotation.z, 0.54 * expected);
    assert.equal(arm.getObjectByName('gripPadLower').rotation.z, 0.54 * expected);
    assert.equal(arm.getObjectByName('fingerUpper').position.y, 0.13);
    assert.equal(arm.getObjectByName('fingerLower').position.y, -0.13);
  }
});

test('mirrored lower jaw preserves flat opposing pad faces through closing', () => {
  const arm = createArmModel();
  assert.equal(arm.getObjectByName('fingerLower').scale.y, -1);
  for (const grip of [0, 0.25, 0.5, 0.75, 1]) {
    applyArmPose(arm, { ...REST_POSE, grip });
    const inverseGripper = arm.getObjectByName('gripper').matrixWorld.clone().invert();
    for (const [name, sign] of [['gripPadUpper', 1], ['gripPadLower', -1]]) {
      const relative = inverseGripper.clone().multiply(arm.getObjectByName(name).matrixWorld);
      const normal = new THREE.Vector3(0, 1, 0).applyMatrix3(new THREE.Matrix3().getNormalMatrix(relative)).normalize();
      assert.ok(Math.abs(normal.y - sign) < 1e-10);
      assert.ok(Math.abs(normal.x) < 1e-10);
    }
  }
});

test('actual bevel-expanded metal tips do not cross the gripper centerline', () => {
  const arm = createArmModel();
  const gripper = arm.getObjectByName('gripper');
  for (const grip of [0, 0.25, 0.5, 0.75, 1]) {
    applyArmPose(arm, { ...REST_POSE, grip });
    for (const [name, sign] of [['fingerUpper', 1], ['fingerLower', -1]]) {
      const finger = arm.getObjectByName(name);
      const metal = finger.children.find(child => child.isMesh && child.geometry.type === 'ExtrudeGeometry');
      const vertices = metal.geometry.attributes.position;
      let tested = 0;
      for (let i = 0; i < vertices.count; i++) {
        const local = new THREE.Vector3().fromBufferAttribute(vertices, i);
        if (local.x < 0.35) continue;
        const point = gripper.worldToLocal(metal.localToWorld(local));
        assert.ok(point.y * sign >= -1e-5, `${name} metal crosses center at grip ${grip}: ${point.y}`);
        tested++;
      }
      assert.ok(tested > 0);
    }
  }
});

test('open shape retains the approved reference bounds', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const bounds = new THREE.Box3().setFromObject(arm);
  assert.ok(Math.abs(bounds.min.x - -1.651947665574) < 0.0001);
  assert.ok(Math.abs(bounds.max.x - 1.677122077662) < 0.0001);
  assert.ok(Math.abs(bounds.max.y - 4.421254284194) < 0.0001);
});
