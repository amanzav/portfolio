import * as THREE from 'three';
import { REST_POSE } from './motion-study.js';
import { workspaceGrip } from './workspace-layout.js';

const ARM_VIEWPORT_HEIGHT = 320;
const TRANSFER_Y = 200;
const PITCH = 0.5;
const DISTANCE = 12;

// Extend the drawing below an unchanged top viewport. Growing article content
// changes the canvas crop, rather than the arm's scale or its document position.
export function configurePhoneWorkspace({ camera = new THREE.PerspectiveCamera(), width, height, topInset = 44 } = {}) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height < ARM_VIEWPORT_HEIGHT
    || !Number.isFinite(topInset) || topInset < 0) {
    throw new Error('The phone workspace needs a positive width and at least 320 pixels of height.');
  }
  camera.clearViewOffset();
  camera.fov = 28;
  camera.near = 0.1;
  camera.far = 100;
  camera.zoom = 1;
  camera.up.set(0, 1, 0);
  const target = new THREE.Vector3(0, 2.2, 0);
  camera.position.copy(target).add(new THREE.Vector3(0, Math.sin(PITCH) * DISTANCE, Math.cos(PITCH) * DISTANCE));
  camera.lookAt(target);
  camera.setViewOffset(width, ARM_VIEWPORT_HEIGHT, 0, -topInset, width, height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return {
    camera,
    layout: { width, height, homeShift: 0, shift: 0, summaryLeft: 0, summaryWidth: width,
      summaryTop: 310 + topInset, armViewportHeight: ARM_VIEWPORT_HEIGHT, topInset },
    restPose: { ...REST_POSE, yaw: 0.6 },
    transferCenter: { x: width / 2, y: TRANSFER_Y + topInset },
  };
}

// Use the source font's measured dimensions for the transfer rectangle. Calling
// again with the heading's dimensions gives its placementContact. Glyph callers
// can adjust these center contacts by the measured glyph-center offset.
export function phoneTitleDock(workspace, { width, height, gripFraction = 0.5 } = {}) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0
    || !Number.isFinite(gripFraction) || gripFraction < 0 || gripFraction > 1) {
    throw new Error('The phone title dock needs positive measured dimensions and a grip fraction from zero to one.');
  }
  const { camera, layout, transferCenter } = workspace;
  const left = transferCenter.x - width / 2;
  const top = transferCenter.y - height / 2;
  const contact = { x: left + width * gripFraction, y: transferCenter.y };
  const placementContact = { x: layout.summaryLeft + width * gripFraction, y: layout.summaryTop + height / 2 };
  const pickup = workspaceGrip(contact, camera, layout, 0);
  const placement = workspaceGrip(placementContact, camera, layout, 1);
  if (pickup.error > 0.02 || placement.error > 0.02) {
    throw new Error('The measured phone title has no exact contact at this grip fraction.');
  }
  return { left, top, width, height, ...contact, contact, pose: pickup.pose,
    placementContact, placementPose: placement.pose };
}
