import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const slugs = ['vooma', 'boomerang', 'ford', 'autopark', 'autopark/ppo', 'multibot'];

for (const slug of slugs) {
  test(`${slug} has a directly addressable article with valid local links`, () => {
    const html = readFileSync(path.join(root, 'content/articles', `${slug.replaceAll('/', '-')}.html`), 'utf8');
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.ok(
      existsSync(path.join(root, 'app', '(sketch)', slug, 'page.tsx'))
      || existsSync(path.join(root, 'app', slug, 'page.tsx')),
      `Missing article page: ${slug}`,
    );
    assert.doesNotMatch(html, /<script\b|\son[a-z]+\s*=/i);

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'IDs must be unique within an article');
    for (const [, anchor] of html.matchAll(/\bhref="#([^"]+)"/g)) {
      assert.ok(ids.includes(anchor), `Missing anchor target: ${anchor}`);
    }
    for (const [, source] of html.matchAll(/\bsrc="([^"]+)"/g)) {
      assert.ok(source.startsWith('/article-diagrams/'), `Unexpected article asset: ${source}`);
      assert.ok(existsSync(path.join(root, 'public', source)), `Missing asset: ${source}`);
    }
    for (const [, href] of html.matchAll(/\bhref="(\/[^"#]*)"/g)) {
      const url = new URL(href, 'https://www.azaveri.com');
      if (url.pathname === '/') continue;
      assert.ok(slugs.includes(url.pathname.replace(/^\/|\/$/g, '')), `Missing local article route: ${href}`);
    }
    assert.doesNotMatch(html, /<details\b[^>]*\bopen(?:\s|>|=)/i);
    assert.doesNotMatch(html, /\b(?:src|href)="\/(?:article\.css|article-navigation\.js|autopark\/diagrams\/)/);
  });
}
