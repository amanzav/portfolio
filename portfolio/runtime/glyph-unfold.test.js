import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleGlyphUnfold } from './glyph-unfold.js';

const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const advance = character => character === ' ' ? 0.3 : /[il.]/u.test(character) ? 0.26 : /[mwM]/u.test(character) ? 0.78 : 0.53;
const phrases = ['Making agents remember.', 'Helping a team build faster.', 'Working close to the vehicle.'];

function layoutFor(text, wrap = false) {
  const chars = Array.from(text), glyphs = [];
  let x = 0, y = 0;
  chars.forEach((character, index) => {
    if (character !== ' ' && (index === 0 || chars[index - 1] === ' ')) {
      let wordWidth = 0;
      for (let next = index; next < chars.length && chars[next] !== ' '; next++) wordWidth += advance(chars[next]);
      if (wrap && x > 0 && x + wordWidth > 9) { x = 0; y += 1.3; }
    }
    glyphs.push({ x, y });
    x += advance(character);
  });
  return { width: wrap ? 9 : x, height: wrap ? 2.6 : 1.25, glyphs };
}

function wordsOf(text) {
  const groups = [];
  let word = [];
  Array.from(text).forEach((character, index) => {
    if (character === ' ') { groups.push(word); word = []; }
    else word.push(index);
  });
  groups.push(word);
  return groups;
}

test('source and destination are exact, inputs remain untouched, and unfolding finishes before placement', () => {
  for (const text of phrases) {
    const source = layoutFor(text, true), target = layoutFor(text);
    const snapshot = JSON.stringify({ source, target });
    assert.deepEqual(sampleGlyphUnfold(text, source, target, 0), source);
    assert.deepEqual(sampleGlyphUnfold(text, source, target, 1), target);
    assert.deepEqual(sampleGlyphUnfold(text, source, target, 0.85), target);
    assert.deepEqual(sampleGlyphUnfold(text, source, target, 0.95), target);
    assert.deepEqual(sampleGlyphUnfold(text, source, target, NaN), source);
    assert.equal(JSON.stringify({ source, target }), snapshot);
  }
});

test('whole words spread first and only rise once horizontal clearance exists', () => {
  for (const text of phrases) {
    const source = layoutFor(text, true), target = layoutFor(text), words = wordsOf(text);
    const spread = sampleGlyphUnfold(text, source, target, 0.3);
    const clear = sampleGlyphUnfold(text, source, target, 0.45);
    const rising = sampleGlyphUnfold(text, source, target, 0.65);
    for (const word of words) for (const index of word) {
      near(spread.glyphs[index].y, source.glyphs[index].y);
      near(clear.glyphs[index].x, target.glyphs[index].x);
      near(rising.glyphs[index].x, target.glyphs[index].x);
      near(spread.glyphs[index].x - spread.glyphs[word[0]].x, source.glyphs[index].x - source.glyphs[word[0]].x);
      near(rising.glyphs[index].x - rising.glyphs[word[0]].x, target.glyphs[index].x - target.glyphs[word[0]].x);
      near(rising.glyphs[index].y - rising.glyphs[word[0]].y, 0);
    }
    assert.ok(words.some(word => rising.glyphs[word[0]].y < source.glyphs[word[0]].y));
  }
});

test('word boxes never overlap, swap order, or overshoot during either unfolding or folding', () => {
  for (const text of phrases) for (const reverse of [false, true]) {
    const source = layoutFor(text, !reverse), target = layoutFor(text, reverse), words = wordsOf(text);
    for (let sample = 0; sample <= 300; sample++) {
      const frame = sampleGlyphUnfold(text, source, target, sample / 300);
      const boxes = words.map(word => ({ left: frame.glyphs[word[0]].x,
        right: frame.glyphs[word.at(-1)].x + advance(Array.from(text)[word.at(-1)]),
        top: frame.glyphs[word[0]].y, bottom: frame.glyphs[word[0]].y + 1 }));
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.bottom > b.top + 1e-8 && b.bottom > a.top + 1e-8) assert.ok(a.right <= b.left + 1e-8 || b.right <= a.left + 1e-8);
      }
      frame.glyphs.forEach((glyph, index) => {
        for (const axis of ['x', 'y']) {
          assert.ok(glyph[axis] >= Math.min(source.glyphs[index][axis], target.glyphs[index][axis]) - 1e-8);
          assert.ok(glyph[axis] <= Math.max(source.glyphs[index][axis], target.glyphs[index][axis]) + 1e-8);
        }
      });
    }
  }
});

test('stage joins have continuous positions and zero velocity, with a quiet final settle', () => {
  const text = phrases[2], source = layoutFor(text, true), target = layoutFor(text);
  for (const boundary of [0, 0.45, 0.85, 1]) {
    const epsilon = 1e-5;
    const before = sampleGlyphUnfold(text, source, target, boundary - epsilon);
    const at = sampleGlyphUnfold(text, source, target, boundary);
    const after = sampleGlyphUnfold(text, source, target, boundary + epsilon);
    for (let index = 0; index < at.glyphs.length; index++) for (const axis of ['x', 'y']) {
      near(before.glyphs[index][axis], after.glyphs[index][axis], 1e-7);
      near((after.glyphs[index][axis] - at.glyphs[index][axis]) / epsilon, 0, 1e-4);
    }
  }
});
