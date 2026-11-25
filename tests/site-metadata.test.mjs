import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = new URL("../out/", import.meta.url);
const origin = "https://www.azaveri.com";
const requiredPaths = [
  "/", "/vooma/", "/boomerang/", "/ford/", "/autopark/",
  "/autopark/ppo/", "/multibot/", "/work/", "/projects/",
  "/tennis/", "/trade/", "/experience/boomerang/",
  "/experience/ford-2025/", "/experience/ford-2024/",
  "/experience/transpire/", "/projects/courseclutch/",
  "/projects/reva/", "/projects/ev-education-game/",
];

test("the exported sitemap keeps new articles and existing shared URLs reachable", async () => {
  const xml = await readFile(new URL("sitemap.xml", output), "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, urls.length, "sitemap URLs must be unique");
  for (const path of requiredPaths) {
    assert.ok(urls.includes(`${origin}${path}`), `missing sitemap URL: ${path}`);
  }
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, origin);
    assert.ok(url.pathname.endsWith("/"), `page URL needs a trailing slash: ${value}`);
    await access(fileURLToPath(new URL(`.${url.pathname}index.html`, output)));
  }
});

test("crawler and hosting files use the same production hostname", async () => {
  const robots = await readFile(new URL("robots.txt", output), "utf8");
  assert.match(robots, /Allow: \/(?:\r?\n|$)/);
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!robots.includes("amanzav.github.io"));
  const cname = await readFile(new URL("CNAME", output), "utf8");
  assert.equal(cname.trim(), "www.azaveri.com");
});
