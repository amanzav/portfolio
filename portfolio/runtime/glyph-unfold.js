const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * t * (10 + t * (-15 + 6 * t)); };
const lerp = (from, to, amount) => from + (to - from) * amount;
const copy = layout => ({ width: layout.width, height: layout.height, glyphs: layout.glyphs.map(glyph => ({ x: glyph.x, y: glyph.y })) });

function wordGroups(text) {
  const groups = [];
  let current = [];
  Array.from(text).forEach((character, index) => {
    if (/\s/u.test(character)) {
      if (current.length) groups.push(current);
      current = [];
    } else current.push(index);
  });
  if (current.length) groups.push(current);
  return groups;
}

function lineCount(layout, groups) {
  const lines = [];
  for (const word of groups) {
    const y = layout.glyphs[word[0]].y;
    if (!lines.some(line => Math.abs(line - y) < 0.25)) lines.push(y);
  }
  return lines.length;
}

function unfold(groups, source, target, progress) {
  if (progress <= 0) return copy(source);
  if (progress >= 0.85) return copy(target);
  const horizontal = smooth(progress / 0.45);
  const vertical = smooth((progress - 0.45) / 0.40);
  const glyphs = source.glyphs.map((glyph, index) => ({
    x: lerp(glyph.x, target.glyphs[index].x, horizontal),
    y: lerp(glyph.y, target.glyphs[index].y, vertical),
  }));
  for (const word of groups) {
    const from = source.glyphs[word[0]], to = target.glyphs[word[0]];
    const anchorX = lerp(from.x, to.x, horizontal);
    const anchorY = lerp(from.y, to.y, vertical);
    for (const index of word) {
      glyphs[index] = {
        x: anchorX + lerp(source.glyphs[index].x - from.x, target.glyphs[index].x - to.x, horizontal),
        y: anchorY + lerp(source.glyphs[index].y - from.y, target.glyphs[index].y - to.y, vertical),
      };
    }
  }
  return { width: lerp(source.width, target.width, horizontal), height: lerp(source.height, target.height, vertical), glyphs };
}

export function sampleGlyphUnfold(text, source, target, progress) {
  if (source.glyphs.length !== target.glyphs.length || Array.from(text).length !== source.glyphs.length) {
    throw new Error('Unfold layouts must describe the same text and glyph count.');
  }
  const t = Number.isFinite(progress) ? clamp(progress) : 0;
  if (t === 0) return copy(source);
  if (t === 1) return copy(target);
  const groups = wordGroups(text);
  const sourceLines = lineCount(source, groups), targetLines = lineCount(target, groups);
  if (sourceLines > targetLines) return unfold(groups, source, target, t);
  if (targetLines > sourceLines) return unfold(groups, target, source, 1 - t);
  const amount = smooth(t);
  return { width: lerp(source.width, target.width, amount), height: lerp(source.height, target.height, amount),
    glyphs: source.glyphs.map((glyph, index) => ({ x: lerp(glyph.x, target.glyphs[index].x, amount), y: lerp(glyph.y, target.glyphs[index].y, amount) })) };
}
