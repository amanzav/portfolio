import * as THREE from 'three';
import { REST_POSE } from './motion-study.js';
import { solveMagneticPose, magneticTurnDepth } from './magnetic-follow.js';
import { projectWorkspace, workspacePlanePoint } from './workspace-layout.js';
import { portfolioFlowField } from './portfolio-field.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const idleCopy = pose => Object.fromEntries(Object.keys(REST_POSE).map(key => [key,
  Number.isFinite(pose?.[key]) ? pose[key] : REST_POSE[key]]));

export function solveBoundedFollow({ pixel, camera, layout, composition = 0, idlePose = REST_POSE, field } = {}) {
  if (!camera || !(layout?.width > 0 && layout?.height > 0)
    || !Number.isFinite(pixel?.x) || !Number.isFinite(pixel?.y)) return idleCopy(idlePose);
  field ??= portfolioFlowField({ layout, composition });
  const base = projectWorkspace(new THREE.Vector3(0, .85, 0), camera, layout, composition);
  const dx = pixel.x - base.x, dy = pixel.y - base.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 52) return idleCopy(idlePose);

  const area = field.viewport ?? { left: 0, top: 0, right: layout.width, bottom: layout.height };
  const halo = Number.isFinite(field.halo) ? Math.max(0, field.halo) : 14;
  const sideInset = Math.min(Math.max(60, layout.height * .193), Math.max(0, (area.right - area.left - halo * 2) / 2));
  const verticalInset = Math.min(Math.max(44, layout.height * .148), Math.max(0, (area.bottom - area.top) / 2));
  // Bound the target before IK, so an unreachable horizontal request cannot
  // consume every joint's movement in the subsequent whole-mesh guard.
  const point = {
    x: clamp(pixel.x - dx / distance * 44, area.left + halo + sideInset, area.right - halo - sideInset),
    y: clamp(pixel.y - dy / distance * 44, area.top + verticalInset, area.bottom - verticalInset),
  };
  const flat = workspacePlanePoint(point, camera, layout, composition, 0);
  if (!flat) return idleCopy(idlePose);
  const depth = magneticTurnDepth(clamp(flat.x, -3.4, 3.4));
  const target = workspacePlanePoint(point, camera, layout, composition, depth);
  if (!target) return idleCopy(idlePose);
  const x = clamp(target.x, -3.4, 3.4);
  return solveMagneticPose(x, clamp(target.y, .65, 4.9), magneticTurnDepth(x));
}
