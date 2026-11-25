import { REST_POSE } from './motion-study.js';

const DURATION = .78;
const keys = Object.keys(REST_POSE);
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = (from, to, value) => {
  const t = clamp((value - from) / (to - from));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const blend = (from, to, t) => Object.fromEntries(keys.map(key => [key, from[key] + (to[key] - from[key]) * t]));

export function createArmEntrance({ arm, drawing, options, stage, reducedMotion }) {
  const finishUniform = { value: 1 };
  const opacityUniform = { value: 1 };
  const materials = [];
  arm.traverse(mesh => {
    if (!mesh.isMesh) return;
    const material = mesh.material;
    material.uniforms.graphiteReveal = finishUniform;
    material.uniforms.paperOpacity = opacityUniform;
    materials.push(material);
  });
  const lines = drawing.group.children.map(line => ({ line, opacity: line.material.opacity }));
  let running = false;
  let time = 0;
  let rest = { ...REST_POSE };
  let folded = { ...rest };
  let target = { ...rest };
  let phase = '';

  function setPhase(next) {
    if (phase === next) return;
    phase = next;
    stage.dataset.entrancePhase = next;
  }
  function finish(reason = 'interaction') {
    if (!running && time === DURATION) return;
    if (running) {
      stage.dataset.entranceEnd = reason;
      setPhase('following');
    }
    running = false;
    time = DURATION;
    finishUniform.value = opacityUniform.value = 1;
    for (const { line, opacity } of lines) line.material.opacity = opacity;
    for (const material of materials) material.transparent = false;
    options.style.removeProperty('opacity');
    stage.dataset.entranceProgress = '1';
  }
  function start(pose, phone) {
    rest = { ...pose }; target = { ...rest }; time = 0;
    if (phone || reducedMotion.matches) {
      finish();
      setPhase(phone ? 'phone-fixed' : 'reduced-motion');
      return { ...rest };
    }
    folded = { ...rest, shoulder: rest.shoulder + .22, elbow: rest.elbow + .83,
      wrist: rest.wrist - 1.62, grip: .72 };
    running = true;
    delete stage.dataset.entranceEnd;
    for (const material of materials) material.transparent = true;
    finishUniform.value = opacityUniform.value = 0;
    options.style.opacity = '0';
    setPhase('drawing');
    stage.dataset.entranceProgress = '0';
    return { ...folded };
  }
  function setMode(phone) {
    setPhase(phone ? 'phone-fixed' : reducedMotion.matches ? 'reduced-motion' : 'following');
  }
  function advance(dt, followPose) {
    time = Math.min(DURATION, time + dt);
    const intervals = { shoulder: [.035, .68], elbow: [.065, .74], wrist: [.13, .78], grip: [.12, .53], yaw: [0, .78], roll: [0, .78] };
    const unfold = Object.fromEntries(keys.map(key => [key,
      folded[key] + (rest[key] - folded[key]) * smooth(...intervals[key], time)]));
    const response = 1 - Math.exp(-10 * dt);
    target = blend(target, followPose, response);
    // Blend a moving, damped endpoint into the end of the unfold, rather than
    // finishing at rest and starting a second motion toward the cursor.
    const pose = blend(unfold, target, smooth(.32, DURATION, time));
    finishUniform.value = smooth(.1, .3, time);
    opacityUniform.value = smooth(.035, .17, time);
    options.style.opacity = String(smooth(.13, .34, time));
    stage.dataset.entranceProgress = (time / DURATION).toFixed(3);
    if (time > .24) setPhase('unfolding');
    if (time === DURATION) {
      finish('complete'); setPhase('following');
    }
    return pose;
  }
  function draw() {
    if (!running) return;
    // Reveal actual contour segments, not a rectangular canvas wipe. The depth
    // pass continues to hide strokes on the backs of the mechanical parts.
    const ink = smooth(0, .23, time);
    for (const { line, opacity } of lines) {
      line.geometry.instanceCount = Math.floor(line.geometry.instanceCount * ink);
      line.material.opacity = opacity * smooth(0, .1, time);
    }
  }
  return { start, advance, draw, finish, setMode, get running() { return running; }, dispose() {
    finish();
    materials.length = 0;
  } };
}
