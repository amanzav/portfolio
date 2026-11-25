import { createCarryWorkspace, sampleCarryWorkspace } from './carry-workspace.js';
import { workspaceGrip, projectWorkspace } from './workspace-layout.js';

export function chooseHomeGripFraction({ camera, layout, home, heading }) {
  for (const fraction of [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]) {
    try {
      const destination = workspaceGrip({ x: heading.left + heading.width * fraction, y: heading.y }, camera, layout, 1);
      if (destination.error > 0.02) continue;
      if ([-9, 0, 3].every(offset => workspaceGrip({ x: home.left + home.width * fraction, y: home.y + offset }, camera, layout, 0).error <= 0.02)) return fraction;
    } catch {}
  }
  throw new Error('The title needs a reachable shared Home and Overview grip point.');
}

export function createHomeCarryWorkspace(options) {
  const plan = createCarryWorkspace(options);
  const originalDepth = plan.depthRise;
  const point = plan.camera.position.clone();
  for (const extraDepth of [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1]) {
    plan.depthRise = originalDepth + extraDepth;
    let maximumError = 0;
    for (let index = 0; index <= 160; index++) {
      const state = sampleCarryWorkspace(plan, plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / 160);
      const actual = projectWorkspace(point.set(state.gripWorld.x, state.gripWorld.y, state.gripWorld.z), plan.camera, plan.layout, state.composition);
      maximumError = Math.max(maximumError, Math.hypot(actual.x - state.screen.x, actual.y - state.screen.y));
    }
    if (maximumError <= 0.02) return plan;
  }
  throw new Error('The Home carry cannot keep exact title contact in the current workspace.');
}
