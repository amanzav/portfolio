import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createArmEntrance } from './arm-entrance.js';
import { createPencilMaterial } from './pencil-material.js';
import { REST_POSE } from './motion-study.js';

function fixture(reduced = false) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = createPencilMaterial(new THREE.MeshStandardMaterial(), geometry);
  const arm = new THREE.Group();
  arm.add(new THREE.Mesh(geometry, material));
  const line = { geometry: { instanceCount: 120 }, material: { opacity: .96 } };
  const options = { style: { opacity: '', removeProperty(key) { this[key] = ''; } } };
  const stage = { dataset: {} };
  const entrance = createArmEntrance({ arm, drawing: { group: { children: [line] } },
    options, stage, reducedMotion: { matches: reduced } });
  return { entrance, material, line, options, stage };
}

test('the desktop entrance unfolds into the existing rest pose within a second', () => {
  const { entrance, material, options, stage } = fixture();
  const rest = { ...REST_POSE, yaw: 1.1 };
  const original = { ...rest };
  let pose = entrance.start(rest, false);
  assert.notDeepEqual(pose, rest);
  assert.deepEqual(rest, original, 'the shared rest pose is not modified');
  assert.equal(options.style.opacity, '0');
  let seconds = 0;
  while (entrance.running && seconds < 1) {
    const previous = pose;
    pose = entrance.advance(1 / 60, rest);
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.ok(Math.max(...Object.keys(rest).map(key => Math.abs(pose[key] - previous[key]))) < .2,
      'joint motion should not jump between frames');
    seconds += 1 / 60;
  }
  assert.equal(entrance.running, false);
  assert.ok(seconds < .81);
  assert.deepEqual(pose, rest);
  assert.equal(stage.dataset.entrancePhase, 'following');
  assert.equal(material.uniforms.graphiteReveal.value, 1);
  assert.equal(material.uniforms.paperOpacity.value, 1);
  assert.equal(material.transparent, false);
  assert.equal(options.style.opacity, '');
});

test('a cursor target is blended into the unfold instead of snapping back to rest', () => {
  const { entrance } = fixture();
  entrance.start(REST_POSE, false);
  const cursorPose = { ...REST_POSE, shoulder: 1.15, elbow: 1.2, wrist: .9, yaw: .4 };
  let pose, previous;
  for (let i = 0; i < 48 && entrance.running; i++) {
    previous = pose;
    pose = entrance.advance(1 / 60, i < 15 ? REST_POSE : cursorPose);
  }
  assert.equal(entrance.running, false);
  assert.ok(Math.abs(pose.yaw - cursorPose.yaw) < .01);
  assert.ok(Math.abs(pose.yaw - REST_POSE.yaw) > .3);
  assert.ok(Math.abs(pose.yaw - previous.yaw) < .02);
  const followingFrame = pose.yaw + (cursorPose.yaw - pose.yaw) * (1 - Math.exp(-7 / 60));
  assert.ok(Math.abs(followingFrame - pose.yaw) < .01, 'normal following can take over from the current pose');
});

test('an early pickup clears the reveal without leaving text or surfaces faded', () => {
  const { entrance, material, line, options, stage } = fixture();
  entrance.start(REST_POSE, false);
  entrance.advance(.1, REST_POSE);
  entrance.draw();
  assert.ok(line.geometry.instanceCount < 120);
  assert.ok(material.uniforms.paperOpacity.value < 1);
  entrance.finish();
  assert.equal(entrance.running, false);
  assert.equal(material.uniforms.paperOpacity.value, 1);
  assert.equal(material.uniforms.graphiteReveal.value, 1);
  assert.equal(material.transparent, false);
  assert.equal(options.style.opacity, '');
  assert.equal(line.material.opacity, .96);
  assert.equal(stage.dataset.entranceEnd, 'interaction');
  // The contour renderer rebuilds the visible segment count each frame.
  line.geometry.instanceCount = 120;
  entrance.draw();
  assert.equal(line.geometry.instanceCount, 120);
});

for (const [name, phone, reduced] of [['phone', true, false], ['reduced motion', false, true]]) {
  test(`${name} shows the fixed, complete arm immediately`, () => {
    const { entrance, material, line, options } = fixture(reduced);
    const rest = { ...REST_POSE, yaw: .6 };
    assert.deepEqual(entrance.start(rest, phone), rest);
    assert.equal(entrance.running, false);
    entrance.draw();
    assert.equal(line.geometry.instanceCount, 120);
    assert.equal(material.uniforms.graphiteReveal.value, 1);
    assert.equal(material.uniforms.paperOpacity.value, 1);
    assert.equal(options.style.opacity, '');
  });
}
