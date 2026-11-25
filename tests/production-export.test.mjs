import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import test from 'node:test';

const output = new URL('../out/', import.meta.url);
const read = file => readFile(new URL(file, output), 'utf8');

test('home ships readable work and contacts before the 3D runtime starts', async () => {
  const html = await read('index.html');
  for (const text of ['Currently building AI systems at Vooma.', 'Better memory for our AI.', 'Better candidate search.', 'In-car infotainment.']) {
    assert.ok(html.includes(text), `Missing server-rendered copy: ${text}`);
  }
  assert.ok(html.includes('class="portfolio-fallback"'));
  assert.ok(html.includes('<details>'));
  assert.ok(html.includes('mailto:a2zaveri@uwaterloo.ca'));
  assert.ok(html.includes('https://github.com/amanzav'));
  assert.doesNotMatch(html, /Read more|BootOverlay|SignalOverlay|RouteGlitch/);
  await access(new URL('portfolio-assets/aman-zaveri-resume.pdf', output));
});

test('only the approved arm entry is published and its assets resolve', async () => {
  const files = await readdir(new URL('portfolio/', output));
  assert.ok(files.includes('home.js') && files.includes('home.css'));
  assert.ok(!files.some(name => name.endsWith('.html') || /study|conveyor|pretext/.test(name)));
  const js = await read('portfolio/home.js');
  assert.ok(js.includes('mountPortfolio'));
  assert.doesNotMatch(js, /127\.0\.0\.1|localhost|\/prototypes\//);
  const css = await read('portfolio/home.css');
  for (const [, asset] of css.matchAll(/url\(["']?(\/portfolio\/[^\s)"']+)/g)) {
    await access(new URL(asset.slice(1), output));
  }
  assert.ok(css.length < 60000, 'paper textures should be cacheable files, not inlined CSS data');
});

test('article pages have their own canonical URLs and no 3D runtime', async () => {
  for (const slug of ['vooma', 'boomerang', 'ford', 'autopark', 'autopark/ppo', 'multibot']) {
    const html = await read(`${slug}/index.html`);
    assert.ok(html.includes(`rel="canonical" href="https://www.azaveri.com/${slug}/"`), slug);
    assert.ok(html.includes('class="work-article"'), slug);
    assert.doesNotMatch(html, /src="\/portfolio\/home\.js/);
    assert.doesNotMatch(html, /working draft/i);
  }
});
