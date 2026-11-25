import { createCarryWorkspace, sampleCarryWorkspace } from './carry-workspace.js';
import { projectWorkspace, workspacePlanePoint } from './workspace-layout.js';
import { solveMagneticPose, forwardTip } from './magnetic-follow.js';

export function sampleCaptionCarryWorkspace(plan, seconds) {
  const state = sampleCarryWorkspace(plan, seconds);
  if (!plan.captionVerticalLead || seconds <= plan.timing.gripEnd || seconds >= plan.timing.placeTime) return state;
  const progress = state.sceneProgress;
  const verticalProgress = progress + plan.captionVerticalLead * Math.sin(Math.PI * progress) / Math.PI;
  const screen = { ...state.screen, y: plan.sourcePixel.y + (plan.destinationPixel.y - plan.sourcePixel.y) * verticalProgress };
  const z = plan.sourceDepth + (plan.destinationDepth - plan.sourceDepth) * progress + plan.depthRise * Math.sin(Math.PI * progress) ** 2;
  const point = workspacePlanePoint(screen, plan.camera, plan.layout, state.composition, z);
  const pose = { ...solveMagneticPose(point.x, point.y, point.z), grip: 1 };
  return { ...state, screen, pose, gripWorld: forwardTip(pose) };
}

function maximumCarryError(plan) {
  const point = plan.camera.position.clone();
  let maximum = 0;
  for (let index = 0; index <= 160; index++) {
    const time = plan.timing.gripEnd + (plan.timing.placeTime - plan.timing.gripEnd) * index / 160;
    const state = sampleCaptionCarryWorkspace(plan, time);
    const actual = projectWorkspace(point.set(state.gripWorld.x, state.gripWorld.y, state.gripWorld.z), plan.camera, plan.layout, state.composition);
    maximum = Math.max(maximum, Math.hypot(actual.x - state.screen.x, actual.y - state.screen.y));
  }
  return maximum;
}

export function createCaptionCarryWorkspace(options) {
  const plan = createCarryWorkspace(options);
  const initialDepthRise = plan.depthRise;
  for (const verticalLead of [0, .25, .5, .75, 1, 1.25, 1.5, 1.75]) {
    plan.captionVerticalLead = verticalLead;
    for (const extraDepth of [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2]) {
      plan.depthRise = initialDepthRise + extraDepth;
      if (maximumCarryError(plan) <= 0.02) return plan;
    }
  }
  // Same-side pickups can reach their endpoints but overextend on the large
  // front arc used to clear the arm during cross-body caption carries.
  plan.captionVerticalLead = 0;
  for (const fraction of [.75, .5, .25, 0]) {
    plan.depthRise = initialDepthRise * fraction;
    if (maximumCarryError(plan) <= 0.02) return plan;
  }
  throw new Error('The caption carry cannot keep exact gripper contact in the current workspace.');
}
