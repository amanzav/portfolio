import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createArmModel } from './arm-model.js';
import { createCameraStudyRig } from './camera-rig.js';
import { createPencilContours } from './pencil-contours.js';
import { applyArmPose, REST_POSE } from './motion-study.js';

function silhouetteEdges(mesh, camera) {
  const positions = mesh.geometry.attributes.position;
  const indices = mesh.geometry.index;
  const vertices = [];
  const ids = [];
  const welded = new Map();
  const edges = new Map();
  for (let i = 0; i < positions.count; i++) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, i);
    const key = point.toArray().map(value => Math.round(value * 1e5)).join(',');
    if (!welded.has(key)) { welded.set(key, vertices.length); vertices.push(point); }
    ids.push(welded.get(key));
  }
  for (let i = 0; i < (indices?.count ?? positions.count); i += 3) {
    const triangle = [0, 1, 2].map(offset => ids[indices ? indices.getX(i + offset) : i + offset]);
    const [a, b, c] = triangle.map(id => vertices[id]);
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    if (normal.lengthSq() < 1e-15) continue;
    normal.normalize();
    for (let j = 0; j < 3; j++) {
      const first = triangle[j], second = triangle[(j + 1) % 3];
      const key = [Math.min(first, second), Math.max(first, second)].join(',');
      if (!edges.has(key)) edges.set(key, { a: vertices[first], b: vertices[second], normals: [] });
      edges.get(key).normals.push(normal);
    }
  }
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  return [...edges.values()].filter(edge => {
    const midpoint = edge.a.clone().lerp(edge.b, 0.5).applyMatrix4(mesh.matrixWorld);
    const view = camera.position.clone().sub(midpoint).normalize();
    const facing = edge.normals.map(normal => normal.clone().applyMatrix3(normalMatrix).normalize().dot(view));
    return Math.max(...facing) > 1e-9 && Math.min(...facing) < -1e-9;
  }).map(edge => ({ a: edge.a.clone().applyMatrix4(mesh.matrixWorld), b: edge.b.clone().applyMatrix4(mesh.matrixWorld) }));
}

const pixel = (world, camera) => {
  const point = world.clone().project(camera);
  return new THREE.Vector2(point.x * 522, point.y * 216);
};
function distanceToSegment(point, a, b) {
  const direction = b.clone().sub(a);
  const t = THREE.MathUtils.clamp(point.clone().sub(a).dot(direction) / direction.lengthSq(), 0, 1);
  return point.distanceTo(a.clone().addScaledVector(direction, t));
}

for (const [label, pose] of [
  ['rest', REST_POSE],
  ['half closed', { ...REST_POSE, grip: 0.5 }],
  ['closed', { ...REST_POSE, grip: 1 }],
  ['turned', { ...REST_POSE, yaw: 0.2, roll: -0.13, grip: 0.2 }],
]) test(`visible long jaw silhouettes remain covered by actual pencil strokes when ${label}`, t => {
  const arm = createArmModel();
  const rig = createCameraStudyRig({ aspect: 1044 / 432, armBounds: new THREE.Box3().setFromObject(arm) });
  const camera = new THREE.PerspectiveCamera(28, 1044 / 432, 0.1, 100);
  camera.position.copy(rig.views.explore.position);
  camera.lookAt(rig.views.explore.target);
  camera.updateMatrixWorld(true);
  applyArmPose(arm, pose);
  const drawing = createPencilContours(arm);
  drawing.update(camera);
  const strokes = [];
  for (const line of drawing.group.children.slice(0, 2)) {
    const positions = line.geometry.attributes.instanceStart.data.array;
    for (let i = 0; i < line.geometry.instanceCount; i++) {
      strokes.push([pixel(new THREE.Vector3().fromArray(positions, i * 6), camera), pixel(new THREE.Vector3().fromArray(positions, i * 6 + 3), camera)]);
    }
  }
  let checked = 0;
  const gaps = [];
  for (const name of ['fingerUpper', 'fingerLower']) {
    const mesh = arm.getObjectByName(name).children.find(child => child.geometry?.type === 'ExtrudeGeometry');
    for (const edge of silhouetteEdges(mesh, camera)) {
      if (pixel(edge.a, camera).distanceTo(pixel(edge.b, camera)) < 3) continue;
      for (const fraction of [0.25, 0.5, 0.75]) {
        const point = edge.a.clone().lerp(edge.b, fraction);
        const ray = new THREE.Raycaster(camera.position, point.clone().sub(camera.position).normalize());
        const hit = ray.intersectObject(arm, true)[0];
        if (hit && hit.distance < camera.position.distanceTo(point) - 0.01) continue;
        const projected = pixel(point, camera);
        const distance = Math.min(...strokes.map(([a, b]) => distanceToSegment(projected, a, b)));
        checked++;
        if (distance > 0.85) gaps.push({ name, fraction, distance });
      }
    }
  }
  drawing.dispose();
  t.diagnostic(`${checked} visible silhouette samples; gaps: ${JSON.stringify(gaps)}`);
  assert.ok(checked > 10);
  assert.deepEqual(gaps, []);
});
