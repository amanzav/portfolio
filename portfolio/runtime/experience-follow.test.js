import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { solveMagneticPose } from './magnetic-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { createExperienceFollow } from './experience-follow.js';

const arm = createArmModel();
applyArmPose(arm, REST_POSE);
const rig = createCameraStudyRig({ aspect: 1044 / 432, armBounds: new THREE.Box3().setFromObject(arm) });
const camera = new THREE.PerspectiveCamera(rig.fov, rig.aspect, rig.near, rig.far);
camera.position.copy(rig.views.explore.position);
camera.lookAt(rig.views.explore.target);
camera.updateMatrixWorld(true);
const settings = { width: 1044, height: 432, canvasShift: 156.6, halo: 14,
  viewport: { left: 585, top: 0, right: 1044, bottom: 432 },
  obstacles: [[31.85, 144.75], [129.85, 221.75], [221.85, 334.75]].map(([top, bottom]) => ({ left: 245, right: 585, top, bottom })) };
const follow = createExperienceFollow({ arm, camera });
const independent = arm.clone(true);
const blend = (a, b, t) => Object.fromEntries(Object.keys(REST_POSE).map(key => [key, a[key] + (b[key] - a[key]) * t]));

function projectedTip(pose) {
  applyArmPose(independent, pose);
  const point = independent.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()).project(camera);
  return { x: (point.x + 1) * 522 + settings.canvasShift, y: (1 - point.y) * 216 };
}
function assertActualMeshSafe(pose) {
  applyArmPose(independent, pose);
  const point = new THREE.Vector3();
  independent.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
      const x = (point.x + 1) * 522 + settings.canvasShift;
      const y = (1 - point.y) * 216;
      assert.ok(x >= 599 && x <= 1030 && y >= 14 && y <= 418, `mesh escaped safe field: ${x},${y}`);
    }
  });
}

test('safe rest clears all note bodies by adjusting only turret yaw without mutating the live arm', t => {
  const before = [];
  arm.traverse(object => before.push(object.matrixWorld.toArray()));
  const result = follow.safeRest(settings);
  assert.ok(result.safe);
  assert.ok(result.pose.yaw > 1 && result.pose.yaw <= 1.2);
  for (const key of Object.keys(REST_POSE).filter(key => key !== 'yaw')) assert.equal(result.pose[key], REST_POSE[key]);
  assertActualMeshSafe(result.pose);
  const after = [];
  arm.traverse(object => after.push(object.matrixWorld.toArray()));
  assert.deepEqual(after, before);
  t.diagnostic(`Safe rest yaw ${result.pose.yaw.toFixed(2)}rad, bounds left ${result.bounds.left.toFixed(2)}px.`);
});

test('damped follow retains meaningful horizontal and vertical motion while every actual mesh stays clear', t => {
  let pose = follow.safeRest(settings).pose;
  const tips = [];
  let blocked = 0;
  const started = performance.now();
  const targets = [[-3, 3, 1], [3.5, 2, .5], [3.5, 4.8, .5], [1, 4.8, 1], [4, 3, .5], [-3, 1.6, .5]];
  for (const [x, y, z] of targets) for (let frame = 0; frame < 45; frame++) {
    const desired = solveMagneticPose(x, y, z);
    const result = follow.constrain({ ...settings, fromPose: pose, candidatePose: blend(pose, desired, .2) });
    assert.equal(result.startedUnsafe, false);
    assert.ok(result.safe);
    blocked += Number(result.blocked);
    pose = result.pose;
    tips.push(projectedTip(pose));
    if (frame % 15 === 0 || frame === 44) assertActualMeshSafe(pose);
  }
  const horizontal = Math.max(...tips.map(point => point.x)) - Math.min(...tips.map(point => point.x));
  const vertical = Math.max(...tips.map(point => point.y)) - Math.min(...tips.map(point => point.y));
  assert.ok(horizontal > 140, `Only ${horizontal.toFixed(1)}px horizontal movement`);
  assert.ok(vertical > 100, `Only ${vertical.toFixed(1)}px vertical movement`);
  assert.ok(blocked > 0);
  t.diagnostic(`Tip range ${horizontal.toFixed(1)}×${vertical.toFixed(1)}px; 270 steps incl vertex verification ${(performance.now() - started).toFixed(1)}ms.`);
});

test('unsafe post-gesture starts request recovery instead of snapping or changing the pickup pose', () => {
  const pose = solveMagneticPose(-3, 3, 1);
  const result = follow.constrain({ ...settings, fromPose: pose, candidatePose: REST_POSE });
  assert.equal(result.startedUnsafe, true);
  assert.deepEqual(result.pose, Object.fromEntries(Object.keys(REST_POSE).map(key => [key, pose[key]])));
  assert.ok(result.recoveryPose);
  assertActualMeshSafe(result.recoveryPose);
  const impossible = follow.safeRest({ ...settings, viewport: { left: 1000, right: 1044, top: 0, bottom: 432 } });
  assert.equal(impossible.safe, false);
});

test('a safe endpoint cannot skip an obstacle crossed by intermediate articulated poses', () => {
  const from = solveMagneticPose(1, 2, .3);
  const candidate = solveMagneticPose(1, 4, 1.5);
  const middle = blend(from, candidate, .5);
  const center = projectedTip(middle);
  const options = { ...settings, halo: 0, softBand: 0,
    viewport: { left: 0, top: 0, right: 1044, bottom: 432 },
    obstacles: [{ left: center.x - 3, right: center.x + 3, top: center.y - 3, bottom: center.y + 3 }] };
  assert.ok(follow.constrain({ ...options, fromPose: from, candidatePose: from }).safe);
  assert.ok(follow.constrain({ ...options, fromPose: candidate, candidatePose: candidate }).safe);
  assert.equal(follow.constrain({ ...options, fromPose: middle, candidatePose: middle }).safe, false);
  const result = follow.constrain({ ...options, fromPose: from, candidatePose: candidate });
  assert.ok(result.safe && result.blocked && result.progress > 0 && result.progress < 1);
  for (let i = 0; i <= 60; i++) {
    const pose = blend(from, result.pose, i / 60);
    assert.ok(follow.constrain({ ...options, fromPose: pose, candidatePose: pose }).safe);
  }
});
