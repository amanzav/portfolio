import { workspaceOffset } from './workspace-layout.js';

export const COMPANY_TAB_CENTERS = [.47, .59, .68];
export const WORK_TAB_CENTER = .25;

export function portfolioMovementField({ layout, composition = 0, reading = false, homeRects = [], articleHeight = 190 }) {
  const obstacles = reading ? [{ left: layout.summaryLeft, top: layout.summaryTop - 10,
    right: layout.summaryLeft + layout.summaryWidth, bottom: layout.summaryTop + Math.max(190, articleHeight) }]
    : homeRects;
  if (reading) for (const [index, center] of [WORK_TAB_CENTER, ...COMPANY_TAB_CENTERS].entries()) {
    const half = index === 2 ? 54 : 42;
    obstacles.push({ left: layout.width * center - half, right: layout.width * center + half, top: 36, bottom: 76 });
  }
  return { width: layout.width, height: layout.height, canvasShift: workspaceOffset(layout, composition),
    halo: reading ? 14 : 22, softBand: 42,
    viewport: { left: 0, top: 0, right: layout.width, bottom: layout.height }, obstacles };
}

export function portfolioFlowField({ layout, composition = 0 }) {
  const progress = Math.max(0, Math.min(1, composition));
  return { width: layout.width, height: layout.height, canvasShift: workspaceOffset(layout, composition),
    halo: 22 - 8 * progress, softBand: 42, obstacles: [],
    viewport: { left: layout.width * (.4 - .2 * progress), top: 0, right: layout.width, bottom: layout.height } };
}
