import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { REST_POSE, applyArmPose } from './motion-study.js';
import { MAGNETIC_LIMITS, solveMagneticPose } from './magnetic-follow.js';
import { createCameraStudyRig } from './camera-rig.js';
import { configureExperienceWorkspace } from './experience-workspace.js';
import { createExperienceFollow } from './experience-follow.js';
import { chooseHomeGripFraction, createHomeCarryWorkspace } from './home-carry.js';
import { sampleCarryWorkspace, readyPoseFacingPlace } from './carry-workspace.js';
import { createCaptionCarryWorkspace, sampleCaptionCarryWorkspace } from './caption-carry.js';
import { portfolioMovementField, portfolioFlowField } from './portfolio-field.js';
import { textRepulsion, settleSpring } from './text-repulsion.js';
import { workspaceLayout, workspaceOffset, projectWorkspace, workspaceGrip } from './workspace-layout.js';

const WIDTHS = [248.46, 259.75, 272.9];
const NOTE_WIDTH = 320;
const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected} by more than ${tolerance}`);

function fixture() {
  const arm = createArmModel();
  applyArmPose(arm, REST_POSE);
  const rig = createCameraStudyRig({ aspect: 1044 / 440, armBounds: new THREE.Box3().setFromObject(arm) });
  const camera = new THREE.PerspectiveCamera(rig.fov, rig.aspect, rig.near, rig.far);
  camera.position.copy(rig.views.explore.position);
  camera.lookAt(rig.views.explore.target);
  camera.zoom = 1.28;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const config = configureExperienceWorkspace({ camera, layout: workspaceLayout(1044, 440),
    titleWidths: WIDTHS, spacious: true });
  return { arm, camera, ...config };
}

function projectedMeshBounds(arm, camera, layout, composition, obstacles = []) {
  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  const point = new THREE.Vector3();
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);
      const pixel = projectWorkspace(point, camera, layout, composition);
      assert.ok(Number.isFinite(pixel.x + pixel.y));
      for (const obstacle of obstacles) assert.ok(pixel.x < obstacle.left - 14 || pixel.x > obstacle.right + 14
        || pixel.y < obstacle.top - 14 || pixel.y > obstacle.bottom + 14, 'Actual geometry entered the text halo');
      bounds.left = Math.min(bounds.left, pixel.x); bounds.right = Math.max(bounds.right, pixel.x);
      bounds.top = Math.min(bounds.top, pixel.y); bounds.bottom = Math.max(bounds.bottom, pixel.y);
    }
  });
  return bounds;
}

function checkCarry(plan, fixture, samples = 100, sample = sampleCarryWorkspace) {
  const { arm, camera, layout } = fixture;
  const baseMatrix = arm.matrixWorld.toArray();
  let worstError = 0;
  let previous;
  for (let index = 0; index <= samples; index++) {
    const time = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / samples;
    const state = sample(plan, time);
    assert.equal(state.attached, true);
    near(state.pose.grip, 1);
    applyArmPose(arm, state.pose);
    const tip = arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3());
    for (const axis of ['x', 'y', 'z']) near(tip[axis], state.gripWorld[axis]);
    const pixel = projectWorkspace(tip, camera, layout, state.composition);
    worstError = Math.max(worstError, Math.hypot(pixel.x - state.screen.x, pixel.y - state.screen.y));
    assert.ok(worstError < .05, `Held text slipped ${worstError}px`);
    if (previous) for (const axis of ['x', 'y']) {
      assert.ok((plan.destinationPixel[axis] - plan.sourcePixel[axis]) * (pixel[axis] - previous[axis]) >= -.001);
    }
    previous = pixel;
    for (const [key, [min, max]] of Object.entries(MAGNETIC_LIMITS)) assert.ok(state.pose[key] >= min && state.pose[key] <= max);
    assert.ok(new THREE.Box3().setFromObject(arm.getObjectByName('wrist')).min.y > .1);
    assert.deepEqual(arm.matrixWorld.toArray(), baseMatrix);
  }
  for (const boundary of [plan.timing.gripEnd, plan.timing.placeTime, plan.timing.releaseTime, plan.timing.turnEnd]) {
    const before = sample(plan, boundary - 1e-7).pose;
    const after = sample(plan, boundary + 1e-7).pose;
    for (const key of Object.keys(REST_POSE)) near(before[key], after[key], .001);
  }
  const placed = sample(plan, plan.landTime);
  const ready = sample(plan, plan.endTime);
  near(ready.pose.yaw, placed.pose.yaw);
  const pixel = projectWorkspace(new THREE.Vector3(placed.gripWorld.x, placed.gripWorld.y, placed.gripWorld.z),
    camera, layout, plan.toComposition);
  near(pixel.x, plan.destinationPixel.x, .05); near(pixel.y, plan.destinationPixel.y, .05);
  return { ready, worstError };
}

test('spacious Home has a centered group, an 80px real-mesh gap, and room inside the paper', () => {
  const { arm, camera, layout, anchors } = fixture();
  applyArmPose(arm, { ...REST_POSE, yaw: 1.1 });
  const bounds = projectedMeshBounds(arm, camera, layout, 0);
  const restPose = { ...REST_POSE, yaw: 1.1 };
  const guarded = createExperienceFollow({ arm, camera }).constrain({ fromPose: restPose, candidatePose: restPose,
    width: layout.width, height: layout.height, canvasShift: workspaceOffset(layout, 0), halo: 14 });
  assert.ok(guarded.safe);
  const textLeft = Math.min(...anchors.map(anchor => anchor.left));
  const textRight = Math.max(...anchors.map(anchor => anchor.left + NOTE_WIDTH));
  near(guarded.bounds.left - textRight, 80, .01);
  near((textLeft + guarded.bounds.right) / 2, layout.width / 2, .01);
  near(bounds.left - textRight, 80, 1);
  assert.ok(Math.abs((textLeft + bounds.right) / 2 - layout.width / 2) < layout.width * .005);
  assert.ok(bounds.top > 14 && bounds.bottom < layout.height - 14);
  for (let index = 1; index < anchors.length; index++) {
    assert.ok(anchors[index].y - anchors[index - 1].y >= 101.5 + 25, 'Home captions need at least 25px between their full text blocks');
  }
  near(workspaceOffset(layout, 1), workspaceOffset(workspaceLayout(layout.width, layout.height), 1));
});

test('all 18 live Home and Overview carries retain actual mesh contact without moving the pedestal', t => {
  const context = fixture();
  const { camera, layout, anchors } = context;
  let count = 0, worstError = 0;
  for (const [index, width] of WIDTHS.entries()) {
    const home = { left: anchors[index].left, width, y: anchors[index].y };
    const heading = { left: layout.summaryLeft, width: width * 24 / 22, y: layout.summaryTop + 15 };
    const fraction = chooseHomeGripFraction({ camera, layout, home, heading });
    const destination = { x: heading.left + heading.width * fraction, y: heading.y };
    for (const offset of [-9, 0, 3]) {
      const source = { x: home.left + width * fraction, y: home.y + offset };
      const forward = createHomeCarryWorkspace({ camera, layout, fromPose: { ...REST_POSE, yaw: 1.1 },
        sourcePixel: source, destinationPixel: destination, gripFraction: fraction });
      const result = checkCarry(forward, context);
      const back = createHomeCarryWorkspace({ camera, layout, fromPose: result.ready.pose,
        sourcePixel: destination, destinationPixel: { x: source.x, y: home.y },
        fromComposition: 1, toComposition: 0, gripFraction: fraction });
      near(back.fromPose.yaw, back.reachPose.yaw);
      worstError = Math.max(worstError, result.worstError, checkCarry(back, context).worstError);
      count += 2;
    }
  }
  assert.equal(count, 18);
  t.diagnostic(`${count} physical paths; maximum held-title error ${worstError.toFixed(6)}px.`);
});

test('both aligned company captions are picked up in place across every summary offset', () => {
  const context = fixture();
  const { camera, layout } = context;
  const widths = [40.96, 67.906, 26.734];
  for (const selected of [0, 1, 2]) {
    let left = layout.summaryLeft + 32;
    for (const [index, width] of widths.entries()) {
      if (index === selected) continue;
      const iconWidth = index === 2 ? 23 : 16;
      const sourcePixel = { x: left + iconWidth / 2, y: 88 };
      left += iconWidth + 7 + width + 24;
      for (const x of [-18, 0, 24]) for (const y of [-6, 0, 6]) {
        const plan = createCaptionCarryWorkspace({ camera, layout, fromPose: REST_POSE, sourcePixel,
          destinationPixel: { x: layout.summaryLeft + 9 + x, y: layout.summaryTop + 30 + 12 + 10 + y },
          fromComposition: 1, toComposition: 1, gripFraction: .5 });
        near(plan.sourcePixel.x, sourcePixel.x);
        near(plan.sourcePixel.y, sourcePixel.y);
        checkCarry(plan, context, 60, sampleCaptionCarryWorkspace);
        for (const time of [0, plan.timing.gripEnd, plan.landTime, plan.endTime]) near(sampleCaptionCarryWorkspace(plan, time).composition, 1);
      }
    }
  }
});

test('selected follow moves while full geometry stays outside the article and company navigation', t => {
  const { arm, camera, layout } = fixture();
  const pickup = workspaceGrip({ x: layout.summaryLeft + WIDTHS[0] * 24 / 22 * .6, y: layout.summaryTop + 15 }, camera, layout, 1);
  const guard = createExperienceFollow({ arm, camera, restPose: readyPoseFacingPlace(pickup.pose) });
  const options = portfolioMovementField({ layout, reading: true, composition: 1 });
  const obstacles = options.obstacles;
  const resting = guard.safeRest(options);
  assert.ok(resting.safe);
  let pose = resting.pose, blocked = 0;
  const tips = [];
  for (const target of [[-3, 3, 1], [3.5, 4, 1], [-1, 4.5, 1.4], [-3, 1.6, .7]]) {
    const desired = solveMagneticPose(...target);
    for (let frame = 0; frame < 35; frame++) {
      const candidate = Object.fromEntries(Object.keys(REST_POSE).map(key => [key, pose[key] + (desired[key] - pose[key]) * .2]));
      const limited = guard.constrain({ ...options, fromPose: pose, candidatePose: candidate });
      assert.equal(limited.startedUnsafe, false);
      assert.ok(limited.safe);
      blocked += Number(limited.blocked);
      pose = limited.pose;
      applyArmPose(arm, pose);
      tips.push(projectWorkspace(arm.getObjectByName('gripPoint').getWorldPosition(new THREE.Vector3()), camera, layout, 1));
      if (frame % 17 === 0) {
        const bounds = projectedMeshBounds(arm, camera, layout, 1, obstacles);
        assert.ok(bounds.left >= 14 && bounds.right <= layout.width - 14 && bounds.top >= 14 && bounds.bottom <= layout.height - 14);
        const stationary = guard.constrain({ ...options, fromPose: pose, candidatePose: pose });
        assert.ok(stationary.safe);
      }
    }
  }
  const horizontal = Math.max(...tips.map(p => p.x)) - Math.min(...tips.map(p => p.x));
  const vertical = Math.max(...tips.map(p => p.y)) - Math.min(...tips.map(p => p.y));
  assert.ok(horizontal > 60 && vertical > 40, `Selected follow only moves ${horizontal}×${vertical}px`);
  assert.ok(blocked > 0);
  t.diagnostic(`Guarded selected tip motion ${horizontal.toFixed(1)}×${vertical.toFixed(1)}px.`);
});

test('text repulsion stays bounded and settles identically at different refresh rates', () => {
  const box = { left: 200, right: 520, top: 100, bottom: 180 };
  assert.deepEqual(textRepulsion({ x: 800, y: 140 }, box), { x: 0, y: 0 });
  const near = textRepulsion({ x: 535, y: 140 }, box);
  assert.ok(near.x < 0 && near.x >= -8);
  assert.equal(near.y, 0);
  const distant = textRepulsion({ x: 600, y: 140 }, box);
  assert.ok(Math.abs(near.x) > Math.abs(distant.x));
  const settle = hz => {
    let value = -8, velocity = 0;
    for (let frame = 0; frame < hz; frame++) {
      const next = settleSpring(value, velocity, 0, 1 / hz);
      assert.ok(next.value >= value && next.value <= 0);
      value = next.value; velocity = next.velocity;
    }
    return value;
  };
  assert.ok(Math.abs(settle(60) - settle(120)) < 1e-8);
});

test('Pretext follow keeps both compositions inside their leftward limits without text obstacles', () => {
  const { arm, camera, layout } = fixture();
  const guard = createExperienceFollow({ arm, camera, restPose: { ...REST_POSE, yaw: 1.1 } });
  for (const composition of [0, 1]) {
    const field = portfolioFlowField({ layout, composition });
    assert.deepEqual(field.obstacles, []);
    const rest = guard.safeRest(field);
    assert.ok(rest.safe);
    let pose = rest.pose;
    let blocked = false;
    const target = solveMagneticPose(-8, 2.2, .8);
    for (let frame = 0; frame < 90; frame++) {
      const candidate = Object.fromEntries(Object.keys(REST_POSE).map(key => [key, pose[key] + (target[key] - pose[key]) * .15]));
      const result = guard.constrain({ ...field, fromPose: pose, candidatePose: candidate });
      assert.ok(result.safe);
      assert.ok(result.bounds.left >= field.viewport.left + field.halo);
      blocked ||= result.blocked;
      pose = result.pose;
    }
    assert.ok(blocked, 'An extreme left target should reach the soft limit');
  }
});
