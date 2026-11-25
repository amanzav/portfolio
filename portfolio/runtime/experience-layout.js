import { workspaceGrip } from './workspace-layout.js';

const ROWS = [0.19, 0.56, 0.36];

export function experienceReadingLayout(layout, sideSign = 1) {
  const sign = sideSign < 0 ? -1 : 1;
  const indexEdge = layout.width * (sign > 0 ? 0.15 : 0.85);
  return {
    sideSign: sign,
    summaryLeft: sign > 0 ? layout.summaryLeft : layout.width * 0.04,
    summaryWidth: layout.summaryWidth,
    indexEdge,
    indexStep: layout.height * 0.085,
    gripEdge: sign > 0 ? 'right' : 'left',
    homeButtonX: indexEdge,
    homeButtonAlign: sign > 0 ? 'left' : 'right',
  };
}

export function createExperienceHomeLayout({ layout, camera, titleWidths, titleHeights = [0, 0, 0], companyWidths = [0, 0, 0], noteHeights = [76, 76, 76] }) {
  if (!Array.isArray(titleWidths) || titleWidths.length !== 3 || titleWidths.some(width => !Number.isFinite(width) || width <= 0)) {
    throw new Error('Three measured experience headline widths are required.');
  }
  const leftColumn = Math.min(
    Math.max(layout.width * 0.12, layout.width * (300 / 1044) - titleWidths[0]),
    layout.width * (350 / 1044) - Math.max(titleWidths[0], titleWidths[1]),
  );
  const anchors = titleWidths.map((width, index) => {
    const side = index === 2 ? 'right' : 'left';
    const gripEdge = side === 'right' ? 'left' : 'right';
    const left = side === 'left' ? leftColumn : layout.width * 0.64;
    const right = left + width;
    const x = gripEdge === 'right' ? right : left;
    const y = layout.height * ROWS[index];
    const titleHeight = Math.max(0, titleHeights[index] || 0);
    for (const offset of [-9, 0, 3]) {
      const grip = workspaceGrip({ x, y: y + offset }, camera, layout, 0);
      if (grip.error > 0.05) throw new Error('The experience headline is outside the exact gripper workspace.');
    }
    return { x, y, left, right, width, side, gripEdge, index,
      titleHeight, titleTop: y - titleHeight / 2, titleBottom: y + titleHeight / 2,
      noteWidth: Math.max(240, width, companyWidths[index] || 0),
      noteHeight: noteHeights[index] || 76 };
  });
  return { anchors };
}
