import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('./workspace-study.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace('export function mountPortfolio', 'function mountPortfolio');

function setupUnavailableRenderer() {
  const controllers = [];
  const events = [];
  let listeners = 0;
  let frames = 0;
  let observers = 0;

  function node() {
    const classes = new Set();
    return {
      dataset: {},
      classList: {
        add: (...values) => values.forEach(value => classes.add(value)),
        remove: (...values) => values.forEach(value => classes.delete(value)),
        contains: value => classes.has(value),
      },
      setAttribute() {},
      append() {},
      prepend() {},
      replaceChildren() {},
      replaceWith() {},
      before() {},
      after() {},
      matches: () => false,
      addEventListener() { listeners += 1; },
      dispatchEvent(event) { events.push(event.type); return true; },
    };
  }

  const root = node();
  root.classList.add('portfolio-mount');
  const stage = node();
  const canvas = node();
  canvas.parentElement = stage;
  const article = node();
  const articleNodes = new Map([
    ['h2', node()], ['.reading-context', node()], ['.reading-intro', node()],
  ]);
  article.querySelector = selector => articleNodes.get(selector) ?? null;
  const rootNodes = new Map([
    ['canvas', canvas], ['main', node()], ['header', node()],
    ['#drag-choices', node()], ['#drag-carrier', node()], ['#reading', article],
    ['#reading-back', node()], ['#fling-trace', node()],
    ['#grip-contact', node()], ['#release-streak', node()],
  ]);
  root.querySelector = selector => rootNodes.get(selector) ?? null;

  const context = {
    AbortController: class extends AbortController {
      constructor() { super(); controllers.push(this); }
    },
    Event,
    document: { createElement: node },
    matchMedia: node,
    createPencilContactLinks: node,
    backIcon: '<svg></svg>',
    THREE: { WebGLRenderer: class {
      constructor() { throw new Error('No graphics context'); }
    } },
    requestAnimationFrame() { frames += 1; },
    ResizeObserver: class {
      constructor() { observers += 1; }
    },
  };
  runInNewContext(`${source}\nthis.mountPortfolio = mountPortfolio;`, context);
  return { root, context, controllers, events,
    activity: () => ({ listeners, frames, observers }) };
}

test('an unavailable renderer fails before readiness and releases the partial mount', () => {
  const state = setupUnavailableRenderer();

  assert.throws(() => state.context.mountPortfolio(state.root), /WebGL is unavailable/);

  assert.equal(state.controllers.length, 1);
  assert.equal(state.controllers[0].signal.aborted, true);
  assert.equal(state.root.classList.contains('portfolio-preview'), false);
  assert.equal(state.root.classList.contains('phone-preview'), false);
  assert.equal(state.root.classList.contains('portfolio-mount'), true);
  assert.equal(state.root.dataset.ready, undefined);
  assert.deepEqual(state.events, []);
  assert.deepEqual(state.activity(), { listeners: 0, frames: 0, observers: 0 });
});

test('a failed mount does not poison a second mount of the restored shell', () => {
  const state = setupUnavailableRenderer();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    assert.throws(() => state.context.mountPortfolio(state.root), /WebGL is unavailable/);
    assert.equal(state.root.classList.contains('portfolio-preview'), false);
    assert.equal(state.root.dataset.ready, undefined);
  }

  assert.equal(state.controllers.length, 2);
  assert.notEqual(state.controllers[0].signal, state.controllers[1].signal);
  assert.ok(state.controllers.every(controller => controller.signal.aborted));
  assert.deepEqual(state.events, []);
  assert.deepEqual(state.activity(), { listeners: 0, frames: 0, observers: 0 });
});
