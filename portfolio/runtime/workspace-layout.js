import { screenPlanePoint, solveScreenGrip } from './screen-grip.js';

export function workspaceLayout(width, height) {
  return {
    width, height, shift: -width * 0.055,
    listLeft: width * 0.15, listTop: height * 0.25, listStep: height * 0.065,
    summaryLeft: width * 0.64, summaryTop: height * 0.24, summaryWidth: width * 0.32,
  };
}
export function workspaceOffset(layout, mix) {
  return (layout.homeShift || 0) + layout.shift * mix;
}
export function projectWorkspace(world, camera, layout, mix) {
  const point = world.clone().project(camera);
  return { x: (point.x + 1) * layout.width / 2 + workspaceOffset(layout, mix), y: (1 - point.y) * layout.height / 2 };
}
export function workspaceGrip(pixel, camera, layout, mix) {
  return solveScreenGrip({ camera, width: layout.width, height: layout.height,
    pixel: { x: pixel.x - workspaceOffset(layout, mix), y: pixel.y }, preferredZ: 1.6 });
}
export function workspacePlanePoint(pixel, camera, layout, mix, z = 0.5) {
  return screenPlanePoint({ camera, width: layout.width, height: layout.height,
    pixel: { x: pixel.x - workspaceOffset(layout, mix), y: pixel.y }, z });
}
