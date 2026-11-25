import test from 'node:test';
import assert from 'node:assert/strict';
import { magneticBlockRepulsion, settleSpring } from './text-repulsion.js';

const box = { left: 200, right: 520, top: 100, bottom: 200 };

test('whole-block force grows on approach, points away, and remains bounded inside the text', () => {
  assert.deepEqual(magneticBlockRepulsion({ x: 700, y: 150 }, box), { x: 0, y: 0 });
  const outside = [620, 590, 560, 530].map(x => magneticBlockRepulsion({ x, y: 150 }, box));
  outside.forEach((force, index) => {
    assert.ok(force.x < 0 && Math.abs(force.x) <= 44);
    assert.equal(force.y, 0);
    if (index) assert.ok(Math.abs(force.x) > Math.abs(outside[index - 1].x));
  });
  for (let x = 160; x <= 560; x += 10) for (let y = 60; y <= 240; y += 10) {
    const force = magneticBlockRepulsion({ x, y }, box);
    assert.ok(Number.isFinite(force.x + force.y));
    assert.ok(Math.abs(force.x) <= 44 && Math.abs(force.y) <= 6);
  }
  assert.ok(magneticBlockRepulsion({ x: 170, y: 150 }, box).x > 0);
  assert.ok(magneticBlockRepulsion({ x: 360, y: 70 }, box).y > 0);
  assert.ok(magneticBlockRepulsion({ x: 360, y: 230 }, box).y < 0);
});

test('magnetic motion settles without overshooting at different refresh rates', () => {
  const target = magneticBlockRepulsion({ x: 535, y: 150 }, box).x;
  const run = hz => {
    let value = 0, velocity = 0;
    for (let frame = 0; frame < hz; frame++) {
      const step = settleSpring(value, velocity, target, 1 / hz, 18);
      assert.ok(step.value <= value && step.value >= target);
      value = step.value; velocity = step.velocity;
    }
    for (let frame = 0; frame < hz; frame++) {
      const step = settleSpring(value, velocity, 0, 1 / hz, 18);
      assert.ok(step.value <= 0 && step.value >= target);
      value = step.value; velocity = step.velocity;
    }
    return value;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 1e-8);
  assert.ok(Math.abs(run(60)) < .001);
});
