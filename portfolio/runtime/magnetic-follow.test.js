import test from 'node:test';
import assert from 'node:assert/strict';
import { MAGNETIC_ARM, MAGNETIC_LIMITS, forwardTip, solveMagneticPose, magneticTurnDepth } from './magnetic-follow.js';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { createCameraStudyRig } from './camera-rig.js';
import { workspaceLayout, workspaceGrip, projectWorkspace } from './workspace-layout.js';

const near = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
};

test('dimensions match the approved mechanical model', () => {
  assert.deepEqual(MAGNETIC_ARM, { upper: 2.15, fore: 2.05, tool: 1.26, shoulderHeight: 0.85 });
});

test('reported tip matches rigid-link forward kinematics across the workspace', () => {
  const { upper, fore, tool, shoulderHeight } = MAGNETIC_ARM;
  for (let x = -5; x <= 5; x += 0.5) {
    for (let y = 0; y <= 6; y += 0.5) {
      const pose = solveMagneticPose(x, y);
      const a = pose.shoulder;
      const b = a + pose.elbow;
      const c = b + pose.wrist;
      const elbowX = upper * Math.cos(a);
      const elbowY = shoulderHeight + upper * Math.sin(a);
      const wristX = elbowX + fore * Math.cos(b);
      const wristY = elbowY + fore * Math.sin(b);
      const localTipX = wristX + tool * Math.cos(c);
      near(pose.tip.x, localTipX * Math.cos(pose.yaw));
      near(pose.tip.y, wristY + tool * Math.sin(c));
      near(pose.tip.z, -localTipX * Math.sin(pose.yaw));
      near(Math.hypot(wristX - elbowX, wristY - elbowY), fore);
      near(Math.hypot(localTipX - wristX, pose.tip.y - wristY), tool);
      assert.ok(pose.yaw >= 0 && pose.yaw <= Math.PI);
      assert.ok(localTipX < 0);
      assert.equal(pose.roll, 0);
      assert.equal(pose.grip, 0);
    }
  }
});

test('extreme targets remain finite, positive elbowed, and within safety limits', () => {
  for (const [x, y, z] of [[1e308, 1e308, 1e308], [-1e308, -1e308, 1e308], [0, -100, 0], [0, 100, 0], [100, 2, 0], [-100, 2, 0]]) {
    const pose = solveMagneticPose(x, y, z);
    assert.equal(pose.clamped, true);
    for (const [joint, [min, max]] of Object.entries(MAGNETIC_LIMITS)) {
      assert.ok(Number.isFinite(pose[joint]));
      assert.ok(pose[joint] >= min && pose[joint] <= max);
    }
    assert.ok(pose.elbow > 0);
    assert.ok(Number.isFinite(pose.tip.x) && Number.isFinite(pose.tip.y) && Number.isFinite(pose.tip.z));
    assert.ok(Number.isFinite(pose.yaw) && pose.yaw >= 0 && pose.yaw <= Math.PI);
  }
});

test('crossing center cannot flip the elbow or wrist even for low targets', () => {
  for (const y of [-5, 1.55, 2, 3, 5]) {
    let previous = solveMagneticPose(-0.1, y);
    for (let x = -0.099; x <= 0.1; x += 0.001) {
      const pose = solveMagneticPose(x, y);
      for (const joint of ['shoulder', 'elbow', 'wrist', 'yaw']) {
        assert.ok(Math.abs(pose[joint] - previous[joint]) < 0.01, `${joint} at ${x},${y}`);
      }
      assert.ok(pose.elbow > 0);
      previous = pose;
    }
  }
});

test('the front-depth dome joins the flat target plane smoothly', () => {
  near(magneticTurnDepth(0), 1.2);
  for (const x of [-5, -2.4, 2.4, 5]) near(magneticTurnDepth(x), 0);
  near(magneticTurnDepth(-1.2), magneticTurnDepth(1.2));
  for (const edge of [-2.4, 2.4]) {
    const before = solveMagneticPose(edge - 1e-5, 3);
    const after = solveMagneticPose(edge + 1e-5, 3);
    for (const joint of ['shoulder', 'elbow', 'wrist', 'yaw']) {
      assert.ok(Math.abs(before[joint] - after[joint]) < 0.001, joint);
    }
    assert.ok(magneticTurnDepth(edge - 1e-5) < 1e-8);
    assert.ok(magneticTurnDepth(edge + 1e-5) < 1e-8);
  }
});

test('mirrored flat targets preserve local joint pose and turn the turret instead', () => {
  const left = solveMagneticPose(-3, 3, 0);
  const right = solveMagneticPose(3, 3, 0);
  near(left.yaw, 0);
  near(right.yaw, Math.PI);
  for (const joint of ['shoulder', 'elbow', 'wrist']) near(left[joint], right[joint]);
  near(left.tip.x, -right.tip.x);
  near(left.tip.y, right.tip.y);
  near(left.tip.z, 0);
  near(right.tip.z, 0);
});

test('tool orientation responds to vertical motion at the same horizontal target', () => {
  const low = solveMagneticPose(-2, 2);
  const high = solveMagneticPose(-2, 4);
  const angle = pose => pose.shoulder + pose.elbow + pose.wrist;
  assert.ok(Math.abs(angle(low) - angle(high)) > 0.2);
  assert.notEqual(low.wrist, high.wrist);
});

test('invalid input restores the exact reference pose and its actual tip', () => {
  const expected = { shoulder: 0.98, elbow: 1.45, wrist: 0.62, yaw: 0, roll: 0, grip: 0 };
  for (const [x, y, z] of [[NaN, 2, 0], [2, Infinity, 0], [undefined, undefined, 0], [2, 3, NaN]]) {
    const { tip, clamped, ...pose } = solveMagneticPose(x, y, z);
    assert.deepEqual(pose, expected);
    assert.deepEqual(tip, forwardTip(expected));
    assert.equal(clamped, true);
  }
});

test('magnetic poses agree with the actual gripper and keep the elbow above the ground', () => {
  const arm = createArmModel();
  for (let x = -5; x <= 5; x += 0.5) {
    for (let y = -1; y <= 6; y += 0.5) {
      const pose = solveMagneticPose(x, y);
      applyArmPose(arm, pose);
      const actualTip = arm.getObjectByName('wrist').localToWorld(new THREE.Vector3(1.26, 0, 0));
      near(actualTip.x, pose.tip.x);
      near(actualTip.y, pose.tip.y);
      near(actualTip.z, pose.tip.z);
      near(arm.getObjectByName('base').rotation.y, 0);
      const elbowCenter = arm.getObjectByName('elbow').getWorldPosition(new THREE.Vector3());
      assert.ok(elbowCenter.y - 0.34 > 0, 'elbow housing intersects ground');
    }
  }
});

test('the lower Home headline grips are exact through hover without changing the model or camera', () => {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const bounds = new THREE.Box3().setFromObject(arm);
  for (const [width, height] of [[1044, 432], [1000, 432], [1100, 432], [1044, 400], [1044, 480]]) {
    const rig = createCameraStudyRig({ aspect: width / height, armBounds: bounds });
    const camera = new THREE.PerspectiveCamera(rig.fov, width / height, rig.near, rig.far);
    camera.position.copy(rig.views.explore.position);
    camera.lookAt(rig.views.explore.target);
    camera.updateMatrixWorld(true);
    const layout = { ...workspaceLayout(width, height), homeShift: width * 0.15, shift: -width * 0.205 };
    for (let index = 0; index < 3; index++) for (const offset of [-9, 0, 3]) {
      const pixel = { x: width * 245 / 1044 + [248.46, 259.75, 272.9][index], y: height * [100, 210, 320][index] / 432 + offset };
      const result = workspaceGrip(pixel, camera, layout, 0);
      applyArmPose(arm, result.pose);
      const actual = projectWorkspace(arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()), camera, layout, 0);
      near(actual.x, pixel.x, 0.05);
      near(actual.y, pixel.y, 0.05);
    }
  }
});

test('low inner-workspace targets turn the tool downward while keeping the actual wrist safely above the pedestal', () => {
  const arm = createArmModel();
  const low = solveMagneticPose(-1.5, 0.7, 0);
  near(low.tip.x, -1.5);
  near(low.tip.y, 0.7);
  assert.ok(low.shoulder + low.elbow + low.wrist > Math.PI * 1.4);
  applyArmPose(arm, low);
  assert.ok(arm.getObjectByName('wrist').getWorldPosition(new THREE.Vector3()).y > 1.5);
  const high = solveMagneticPose(-1.5, 1.9, 0);
  assert.ok(high.tip.y - low.tip.y > 1);
  let previous = solveMagneticPose(-1.5, 0.4, 0);
  for (let y = 0.401; y < 2; y += 0.001) {
    const pose = solveMagneticPose(-1.5, y, 0);
    for (const key of ['shoulder', 'elbow', 'wrist']) assert.ok(Math.abs(pose[key] - previous[key]) < 0.02, key);
    previous = pose;
  }
});

test('actual moving mesh bounds clear the floor and wrist/jaw bounds stay outside the pedestal across low targets', t => {
  const arm = createArmModel();
  const moving = [], wrist = new Set();
  arm.getObjectByName('shoulder').traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    moving.push(mesh);
  });
  arm.getObjectByName('wrist').traverse(mesh => { if (mesh.isMesh) wrist.add(mesh); });
  const pedestal = new THREE.Box3(new THREE.Vector3(-0.77, 0, -0.77), new THREE.Vector3(0.77, 0.44, 0.77));
  const bounds = new THREE.Box3();
  let minimumClearance = Infinity;
  for (const radius of [0.5, 0.75, 1, 1.2, 1.5, 1.8, 2.2, 2.6, 3, 3.5, 4, 4.5]) {
    for (const y of [-2, 0, 0.45, 0.65, 0.85, 1.1, 1.5, 1.9]) {
      for (const yaw of [0, 0.4, 0.8, 1.2, 1.6, 2, 2.5, Math.PI]) {
        const pose = solveMagneticPose(-radius * Math.cos(yaw), y, radius * Math.sin(yaw));
        applyArmPose(arm, pose);
        for (const mesh of moving) {
          bounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
          minimumClearance = Math.min(minimumClearance, bounds.min.y);
          assert.ok(bounds.min.y > 0.1, 'Actual metal geometry intersects the floor.');
          if (wrist.has(mesh)) assert.equal(bounds.intersectsBox(pedestal), false, 'Wrist or jaw enters the pedestal.');
        }
      }
    }
  }
  t.diagnostic(`Lowest actual moving-mesh bound: ${minimumClearance.toFixed(3)} world units above the floor.`);
});
