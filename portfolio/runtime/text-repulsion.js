const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function textRepulsion(point, rect, radius = 100) {
  const nearest = { x: clamp(point.x, rect.left, rect.right), y: clamp(point.y, rect.top, rect.bottom) };
  let dx = nearest.x - point.x, dy = nearest.y - point.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return { x: 0, y: 0 };
  if (distance < .001) { dx = (rect.left + rect.right) / 2 - point.x || -1; dy = 0; }
  const length = Math.hypot(dx, dy);
  const t = 1 - distance / radius;
  const force = t * t * (3 - 2 * t);
  return { x: dx / length * force * 8, y: dy / length * force * 2 };
}

export function settleSpring(value, velocity, target, dt, frequency = 24) {
  const delta = value - target;
  const decay = Math.exp(-frequency * dt);
  const step = (velocity + frequency * delta) * dt;
  return { value: target + (delta + step) * decay, velocity: (velocity - frequency * step) * decay };
}

export function magneticBlockRepulsion(point, rect, { radius = 112, maxX = 44, maxY = 6, preferredX = -1 } = {}) {
  if (![point?.x, point?.y, rect?.left, rect?.right, rect?.top, rect?.bottom].every(Number.isFinite)) return { x: 0, y: 0 };
  const nearX = clamp(point.x, rect.left, rect.right), nearY = clamp(point.y, rect.top, rect.bottom);
  let dx = nearX - point.x, dy = nearY - point.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return { x: 0, y: 0 };
  if (distance < .001) {
    dx = (rect.left + rect.right) / 2 - point.x;
    dy = ((rect.top + rect.bottom) / 2 - point.y) * .35;
    if (Math.hypot(dx, dy) < .001) dx = preferredX;
  }
  const length = Math.hypot(dx, dy);
  const t = 1 - distance / radius, force = t * t * (3 - 2 * t);
  return { x: dx / length * force * maxX, y: dy / length * force * maxY };
}
