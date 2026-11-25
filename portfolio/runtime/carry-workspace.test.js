import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCarryWorkspace, sampleCarryWorkspace } from './carry-workspace.js';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS } from './magnetic-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { configureExperienceWorkspace } from './experience-workspace.js';
import { workspaceLayout, workspaceGrip, projectWorkspace } from './workspace-layout.js';

const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const arm = createArmModel();
applyArmPose(arm, REST_POSE);
const base = arm.getObjectByName('base').matrixWorld.toArray();
const rig = createCameraStudyRig({ aspect: 1044 / 432, armBounds: new THREE.Box3().setFromObject(arm) });
const camera = new THREE.PerspectiveCamera(rig.fov, 1044 / 432, rig.near, rig.far);
camera.position.copy(rig.views.explore.position);
camera.lookAt(rig.views.explore.target);
camera.zoom = 1.25;
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);
const { layout, anchors, reading } = configureExperienceWorkspace({ camera, layout: workspaceLayout(1044, 432) });
const headings = [271.05, 283.36, 297.71];

test('zoomed rest geometry fits and all center grips work before any canvas glide', () => {
  applyArmPose(arm, REST_POSE);
  let minY = Infinity, maxY = -Infinity;
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const pixel = projectWorkspace(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld), camera, layout, 0);
      minY = Math.min(minY, pixel.y); maxY = Math.max(maxY, pixel.y);
    }
  });
  assert.ok(minY > 14 && maxY < layout.height - 14);
  for (const note of anchors) for (const offset of [-9, 0, 3]) {
    const source = { x: note.left + note.width / 2, y: note.y + offset };
    const destination = { x: reading.summaryLeft + headings[note.index] / 2, y: layout.summaryTop + 15 };
    assert.ok(workspaceGrip(source, camera, layout, 0).error < 0.05);
    assert.ok(workspaceGrip(destination, camera, layout, 1).error < 0.05);
  }
});

test('Home and Back carry every word continuously along monotonic screen paths while gliding, then return empty without changing facing', t => {
  let floor = Infinity;
  for (const note of anchors) for (const offset of [-9, 0, 3]) for (const opening of [true, false]) {
    const home = { x: note.left + note.width / 2, y: note.y };
    const heading = { x: reading.summaryLeft + headings[note.index] / 2, y: layout.summaryTop + 15 };
    const source = opening ? { ...home, y: home.y + offset } : heading;
    const destination = opening ? heading : home;
    const plan = createCarryWorkspace({ camera, layout, fromPose: REST_POSE, sourcePixel: source, destinationPixel: destination,
      fromComposition: opening ? 0 : 1, toComposition: opening ? 1 : 0 });
    for (let time = 0; time <= plan.timing.gripEnd; time += 0.002) near(sampleCarryWorkspace(plan, time).composition, plan.fromComposition);
    let previous = { ...source };
    for (let i = 0; i <= 250; i++) {
      const time = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * i / 250;
      const state = sampleCarryWorkspace(plan, time);
      assert.equal(state.attached, true);
      near(state.pose.grip, 1);
      applyArmPose(arm, state.pose);
      const actual = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
      for (const axis of ['x', 'y', 'z']) near(actual[axis], state.gripWorld[axis]);
      const pixel = projectWorkspace(actual, camera, layout, state.composition);
      near(pixel.x, state.screen.x, 0.05); near(pixel.y, state.screen.y, 0.05);
      for (const axis of ['x', 'y']) assert.ok(Math.sign(destination[axis] - source[axis]) * (pixel[axis] - previous[axis]) >= -0.0001);
      previous = pixel;
      for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(state.pose[key] >= min && state.pose[key] <= max);
      const bounds = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
      floor = Math.min(floor, bounds.min.y);
      assert.ok(bounds.min.y > 0.1);
      assert.deepEqual(arm.getObjectByName('base').matrixWorld.toArray(), base);
    }
    const placed = sampleCarryWorkspace(plan, plan.landTime);
    const ready = sampleCarryWorkspace(plan, plan.endTime);
    near(ready.pose.yaw, placed.pose.yaw);
    const nextPickup = workspaceGrip(destination, camera, layout, plan.toComposition);
    near(ready.pose.yaw, nextPickup.pose.yaw);
    for (let time = plan.landTime; time <= plan.endTime; time += 0.002) near(sampleCarryWorkspace(plan, time).composition, plan.toComposition);
    assert.equal(ready.attached, false);
    for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime, plan.timing.releaseTime, plan.timing.turnEnd]) {
      const a = sampleCarryWorkspace(plan, boundary - 1e-7), b = sampleCarryWorkspace(plan, boundary + 1e-7);
      for (const key of Object.keys(REST_POSE)) near(a.pose[key], b.pose[key], 0.001);
    }
  }
  t.diagnostic(`Minimum wrist/jaw floor clearance during18helddrags: ${floor.toFixed(3)}.`);
});

test('ready hands clear the text and keep the tool aimed at the placed destination', () => {
  for (const note of anchors) for (const opening of [true, false]) {
    const home = { x: note.left + note.width / 2, y: note.y };
    const heading = { x: reading.summaryLeft + headings[note.index] / 2, y: layout.summaryTop + 15 };
    const plan = createCarryWorkspace({ camera, layout, fromPose: REST_POSE, sourcePixel: opening ? home : heading,
      destinationPixel: opening ? heading : home, fromComposition: opening ? 0 : 1, toComposition: opening ? 1 : 0 });
    const state = sampleCarryWorkspace(plan, plan.endTime);
    applyArmPose(arm, state.pose);
    const wristPoint = arm.getObjectByName('wrist').getWorldPosition(new THREE.Vector3());
    const tool = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()).sub(wristPoint).normalize();
    const target = new THREE.Vector3(plan.place.x, plan.place.y, plan.place.z).sub(wristPoint).normalize();
    near(tool.clone().cross(target).length(), 0);
    assert.ok(tool.dot(target) > 0.999);
    const bounds = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
    const projected = [];
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      projected.push(projectWorkspace(new THREE.Vector3(x, y, z), camera, layout, plan.toComposition));
    }
    if (opening) assert.ok(Math.max(...projected.map(point => point.x)) <= reading.summaryLeft - 30);
    else assert.ok(Math.min(...projected.map(point => point.x)) >= note.left + note.noteWidth + 20);
  }
});

test('all three centered company switches keep held text on a monotonic screen path with the reading composition fixed', () => {
  for (const [index, width] of [43.08, 76.31, 32].entries()) {
    const sourcePixel = { x: reading.indexEdge + width / 2, y: layout.listTop + index * reading.indexStep - 2 };
    const destinationPixel = { x: reading.summaryLeft + width * 13 / 16 / 2,
      y: layout.summaryTop + 30 + 8 + 18.85 / 2 };
    const plan = createCarryWorkspace({ camera, layout, fromPose: REST_POSE, sourcePixel, destinationPixel,
      fromComposition: 1, toComposition: 1 });
    let previous = sourcePixel.x;
    for (let i = 0; i <= 200; i++) {
      const state = sampleCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * i / 200);
      near(state.composition, 1);
      near(state.pose.grip, 1);
      assert.equal(state.attached, true);
      applyArmPose(arm, state.pose);
      const pixel = projectWorkspace(arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()), camera, layout, 1);
      near(pixel.x, state.screen.x, 0.05); near(pixel.y, state.screen.y, 0.05);
      assert.ok(pixel.x >= previous - 0.0001);
      previous = pixel.x;
      assert.ok(new THREE.Box3().setFromObject(arm.getObjectByName('wrist')).min.y > 0.1);
    }
    const ready = sampleCarryWorkspace(plan, plan.endTime);
    near(ready.pose.yaw, plan.placePose.yaw);
    applyArmPose(arm, ready.pose);
    const bounds = new THREE.Box3().setFromObject(arm.getObjectByName('wrist'));
    let right = -Infinity;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      right = Math.max(right, projectWorkspace(new THREE.Vector3(x, y, z), camera, layout, 1).x);
    }
    assert.ok(right <= reading.summaryLeft - 30);
  }
});

test('carry, opening, and empty return run consecutively without a placement hold or early detachment', () => {
  for (const note of anchors) for (const opening of [true, false]) {
    const home = { x: note.left + note.width / 2, y: note.y };
    const heading = { x: reading.summaryLeft + headings[note.index] / 2, y: layout.summaryTop + 15 };
    const plan = createCarryWorkspace({ camera, layout, fromPose: REST_POSE,
      sourcePixel: opening ? home : heading, destinationPixel: opening ? heading : home,
      fromComposition: opening ? 0 : 1, toComposition: opening ? 1 : 0 });
    near(plan.timing.placeTime - plan.timing.gripEnd, 0.28);
    near(plan.timing.releaseTime - plan.timing.placeTime, 0.045);
    near(plan.timing.turnEnd - plan.timing.releaseTime, 0.15);
    near(plan.landTime, plan.timing.placeTime);
    const beforePlace = sampleCarryWorkspace(plan, plan.landTime - 1e-7);
    assert.equal(beforePlace.attached, true);
    assert.equal(beforePlace.placed, false);
    near(beforePlace.pose.grip, 1);
    const placed = sampleCarryWorkspace(plan, plan.landTime);
    assert.equal(placed.placed, true);
    near(placed.pose.grip, 1);
    const openingJaws = sampleCarryWorkspace(plan, plan.landTime + 0.01);
    assert.ok(openingJaws.pose.grip < 1);
    for (const axis of ['x', 'y', 'z']) near(openingJaws.gripWorld[axis], placed.gripWorld[axis]);
    const released = sampleCarryWorkspace(plan, plan.timing.releaseTime);
    assert.equal(released.attached, false);
    near(released.pose.grip, 0);
    const returning = sampleCarryWorkspace(plan, plan.timing.releaseTime + 0.025);
    const movement = Math.hypot(...['x', 'y', 'z'].map(axis => returning.gripWorld[axis] - released.gripWorld[axis]));
    assert.ok(movement > 0.01, 'The empty arm must start returning immediately after opening.');
    near(returning.pose.yaw, placed.pose.yaw);
    near(sampleCarryWorkspace(plan, plan.timing.turnEnd).pose.yaw, placed.pose.yaw);
    assert.equal(sampleCarryWorkspace(plan, plan.endTime).done, true);
  }
});

test('switching employers returns to the same title-facing pose so Back needs no turret turnaround', () => {
  for (const [index, width] of [43.08, 76.31, 32].entries()) {
    const heading = { x: reading.summaryLeft + headings[index] / 2, y: layout.summaryTop + 15 };
    const switched = createCarryWorkspace({ camera, layout, fromPose: REST_POSE,
      sourcePixel: { x: reading.indexEdge + width / 2, y: layout.listTop + index * reading.indexStep - 2 },
      destinationPixel: { x: reading.summaryLeft + width * 13 / 16 / 2, y: layout.summaryTop + 30 + 8 + 18.85 / 2 },
      fromComposition: 1, toComposition: 1, readyPixel: heading });
    const ready = sampleCarryWorkspace(switched, switched.endTime);
    const back = createCarryWorkspace({ camera, layout, fromPose: ready.pose, sourcePixel: heading,
      destinationPixel: { x: anchors[index].left + anchors[index].width / 2, y: anchors[index].y },
      fromComposition: 1, toComposition: 0 });
    near(ready.pose.yaw, back.reachPose.yaw);
    for (let time = 0; time <= back.timing.gripEnd; time += .005) {
      near(sampleCarryWorkspace(back, time).pose.yaw, ready.pose.yaw);
    }
  }
});
