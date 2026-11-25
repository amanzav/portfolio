import { workspaceGrip } from './workspace-layout.js';

export function configureExperienceWorkspace({ camera, layout, titleWidths = [248.46, 259.75, 272.9], titleHeights = [27.5, 27.5, 27.5], spacious = false }) {
  if (titleWidths.length !== 3 || titleWidths.some(width => !Number.isFinite(width) || width <= 0)) {
    throw new Error('Three measured experience headline widths are required.');
  }
  const configured = { ...layout,
    summaryTop: layout.summaryTop + (spacious ? 32 : 0),
    homeShift: layout.width * (spacious ? 200.5328 / 1044 : .19),
    shift: -layout.width * (spacious ? 257.9528 / 1044 : .245) };
  const left = layout.width * (spacious ? 222.4546 : 243) / 1044;
  const anchors = titleWidths.map((width, index) => {
    const y = layout.height * (spacious ? [80, 205, 330] : [100, 210, 320])[index] / 432;
    const x = left + width;
    for (const offset of [-9, 0, 3]) {
      if (workspaceGrip({ x, y: y + offset }, camera, configured, 0).error > 0.05) {
        throw new Error('The experience headline is outside the exact gripper workspace.');
      }
    }
    const titleHeight = Math.max(0, titleHeights[index] || 0);
    return { x, y, left, right: x, width, index, side: 'left', gripEdge: 'right',
      titleHeight, titleTop: y - titleHeight / 2, titleBottom: y + titleHeight / 2,
      noteWidth: Math.max(300, width) };
  });
  return { layout: configured, anchors, reading: {
    sideSign: 1, summaryLeft: configured.summaryLeft, summaryWidth: configured.summaryWidth,
    indexEdge: configured.width * 0.15, indexStep: configured.height * 0.085,
    gripEdge: 'right', homeButtonX: configured.width * 0.15, homeButtonAlign: 'left',
  } };
}
