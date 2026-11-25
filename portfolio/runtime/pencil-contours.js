import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

const scratch = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();
const hash = value => Math.sin(value * 127.1 + 311.7) * 0.5 + 0.5;

function topology(mesh) {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  const welded = new Map();
  const vertices = [];
  const vertexIds = [];
  const edges = new Map();
  for (let i = 0; i < positions.count; i++) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, i);
    const key = point.toArray().map(value => Math.round(value * 100000)).join(',');
    if (!welded.has(key)) { welded.set(key, vertices.length); vertices.push(point); }
    vertexIds.push(welded.get(key));
  }
  const count = indices?.count ?? positions.count;
  for (let i = 0; i < count; i += 3) {
    const triangle = [0, 1, 2].map(offset => vertexIds[indices ? indices.getX(i + offset) : i + offset]);
    const [a, b, c] = triangle.map(index => vertices[index]);
    const normal = new THREE.Vector3().subVectors(b, a).cross(scratch.subVectors(c, a));
    if (normal.lengthSq() < 1e-15) continue;
    normal.normalize();
    for (let j = 0; j < 3; j++) {
      const first = triangle[j];
      const second = triangle[(j + 1) % 3];
      const key = `${Math.min(first, second)},${Math.max(first, second)}`;
      if (!edges.has(key)) edges.set(key, { a: vertices[first], b: vertices[second], normals: [] });
      edges.get(key).normals.push(normal);
    }
  }
  geometry.computeBoundingBox();
  return { mesh, edges: [...edges.values()], size: geometry.boundingBox.getSize(new THREE.Vector3()).length() };
}

function material(width, opacity) {
  return new LineMaterial({
    color: 0xffffff, vertexColors: true, linewidth: width, opacity,
    transparent: true, depthTest: true, depthWrite: false, alphaToCoverage: true,
    toneMapped: false,
  });
}

function cachedStroke(start, end, seed, amount = 1, offset = 0, normal = null) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 0.001) return null;
  const steps = Math.max(1, Math.ceil(length / 0.065));
  const perpendicular = direction.clone().cross(normal ?? new THREE.Vector3(0, 0, 1));
  if (perpendicular.lengthSq() < 1e-12) perpendicular.crossVectors(direction, new THREE.Vector3(0, 1, 0));
  perpendicular.normalize();
  const points = new Float32Array((steps + 1) * 3);
  const pressures = new Float32Array(steps + 1);
  const point = new THREE.Vector3();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    point.lerpVectors(start, end, t);
    const tremor = Math.sin(point.x * 28 + point.y * 31 + seed) * 0.0018
      + Math.sin(t * 7 + seed * 1.7) * 0.0025;
    point.addScaledVector(perpendicular, (tremor + offset) * amount);
    point.toArray(points, i * 3);
    pressures[i] = hash(seed + i * 0.17);
  }
  return { points, pressures, steps };
}

export function createPencilContours(arm, { constructionGuides = true } = {}) {
  const group = new THREE.Group();
  group.name = 'Pencil strokes';
  const parts = [];
  arm.traverse(mesh => { if (mesh.isMesh) parts.push(topology(mesh)); });
  const materials = {
    contour: material(1.65, 0.96),
    detail: material(0.9, 0.8),
    echo: material(0.6, 0.22),
    construction: material(0.65, 0.24),
  };
  const buckets = {};
  for (const [name, strokeMaterial] of Object.entries(materials)) {
    const geometry = new LineSegmentsGeometry();
    const line = new LineSegments2(geometry, strokeMaterial);
    line.renderOrder = 2;
    line.frustumCulled = false;
    group.add(line);
    buckets[name] = { line, positions: null, colors: null, capacity: 0, count: 0 };
  }
  const bucketList = Object.values(buckets);

  function reserve(bucket, required) {
    if (required <= bucket.capacity) return;
    const capacity = Math.max(256, 2 ** Math.ceil(Math.log2(required)));
    const positions = new Float32Array(capacity * 6);
    const colors = new Float32Array(capacity * 6);
    if (bucket.positions) positions.set(bucket.positions);
    if (bucket.colors) colors.set(bucket.colors);
    // Growth is rare; steady-state frames retain the same GPU buffers.
    bucket.line.geometry.dispose();
    const geometry = new LineSegmentsGeometry().setPositions(positions).setColors(colors);
    geometry.attributes.instanceStart.data.setUsage(THREE.DynamicDrawUsage);
    geometry.attributes.instanceColorStart.data.setUsage(THREE.DynamicDrawUsage);
    bucket.line.geometry = geometry;
    Object.assign(bucket, { positions, colors, capacity });
  }

  parts.forEach(({ edges, size }, partIndex) => {
    edges.forEach((edge, edgeIndex) => {
      const seed = partIndex * 19.7 + edgeIndex * 0.37;
      edge.crease = edge.normals.length > 1 && edge.normals[0].dot(edge.normals[1]) < 0.64;
      edge.stroke = cachedStroke(edge.a, edge.b, seed, size > 0.3 ? 1 : 0.3, 0, edge.normals[0]);
      if (size > 0.6 && edge.a.distanceTo(edge.b) > 0.2 && hash(seed) > 0.62) {
        const direction = new THREE.Vector3().subVectors(edge.b, edge.a).normalize();
        edge.echo = cachedStroke(edge.a.clone().addScaledVector(direction, -0.03),
          edge.b.clone().addScaledVector(direction, 0.04), seed + 9, 1.5, 0.009, edge.normals[0]);
      }
    });
  });

  const construction = [];
  function guide(parent, start, end, seed, amount = 0.5) {
    construction.push({ parent, stroke: cachedStroke(start, end, seed, amount) });
  }
  if (constructionGuides) {
    for (const [name, radius, length, z] of [['shoulder', 0.46, 2.15, 0.45], ['elbow', 0.43, 2.05, 0.45], ['wrist', 0.29, 0.3, 0.33]]) {
      const joint = arm.getObjectByName(name);
      if (!joint) continue;
      const points = [];
      for (let i = 0; i <= 36; i++) {
        const angle = i / 36 * Math.PI * 1.6 - 0.3;
        const r = radius + Math.sin(i * 0.7) * 0.004;
        points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, z));
      }
      for (let i = 0; i < 36; i++) guide(joint, points[i], points[i + 1], i);
      guide(joint, new THREE.Vector3(-radius - 0.07, 0, z), new THREE.Vector3(radius + 0.11, 0, z), 70);
      guide(joint, new THREE.Vector3(0, -radius - 0.09, z), new THREE.Vector3(0, radius + 0.08, z), 71);
      if (length > 1) guide(joint, new THREE.Vector3(-0.12, 0.34, 0.29), new THREE.Vector3(length + 0.17, 0.21, 0.29), 80);
    }
    for (let i = 0; i < 52; i++) {
      const x = (hash(i * 1.9) - 0.5) * 2.1;
      const z = (hash(i * 7.3) - 0.5) * 0.8;
      guide(arm, new THREE.Vector3(x, 0.003, z), new THREE.Vector3(x + 0.1 + hash(i) * 0.24, 0.003, z + 0.06), i, 1);
    }
    for (let i = 0; i < 3; i++) {
      guide(arm, new THREE.Vector3(-1.1 + i * 0.1, 0.003, 0.3 + i * 0.07),
        new THREE.Vector3(1.2 - i * 0.08, 0.003, 0.33 + i * 0.07), 90 + i, 1);
    }
  }

  const point = new THREE.Vector3();
  const cameraEye = new THREE.Vector3();
  const edgeMidpoint = new THREE.Vector3();
  const edgeViewDirection = new THREE.Vector3();
  const pointViewDirection = new THREE.Vector3();
  let perspectiveCamera = false;
  function writeStroke(name, stroke, matrix) {
    if (!stroke) return;
    const bucket = buckets[name];
    reserve(bucket, bucket.count + stroke.steps);
    for (let i = 0; i < stroke.steps; i++) {
      const offset = (bucket.count + i) * 6;
      for (let j = 0; j < 2; j++) {
        point.fromArray(stroke.points, (i + j) * 3).applyMatrix4(matrix);
        if (perspectiveCamera) {
          pointViewDirection.subVectors(cameraEye, point).normalize();
          point.addScaledVector(pointViewDirection, 0.007);
        } else point.addScaledVector(cameraDirection, 0.007);
        point.toArray(bucket.positions, offset + j * 3);
        const pressure = stroke.pressures[i + j];
        const value = name === 'contour' ? 0.012 + pressure * 0.045 : 0.065 + pressure * 0.1;
        bucket.colors.fill(value, offset + j * 3, offset + j * 3 + 3);
      }
    }
    bucket.count += stroke.steps;
  }

  function update(camera) {
    arm.updateMatrixWorld(true);
    camera.getWorldDirection(cameraDirection).negate();
    perspectiveCamera = !!camera.isPerspectiveCamera;
    if (perspectiveCamera) camera.getWorldPosition(cameraEye);
    for (const bucket of bucketList) bucket.count = 0;
    for (const { mesh, edges, size } of parts) {
      normalMatrix.getNormalMatrix(mesh.matrixWorld);
      for (const edge of edges) {
        if (perspectiveCamera) {
          edgeMidpoint.addVectors(edge.a, edge.b).multiplyScalar(0.5).applyMatrix4(mesh.matrixWorld);
          edgeViewDirection.subVectors(cameraEye, edgeMidpoint).normalize();
        }
        const facingDirection = perspectiveCamera ? edgeViewDirection : cameraDirection;
        let front = -Infinity;
        let back = Infinity;
        for (const normal of edge.normals) {
          const facing = scratch.copy(normal).applyMatrix3(normalMatrix).normalize().dot(facingDirection);
          front = Math.max(front, facing);
          back = Math.min(back, facing);
        }
        // Near-tangent bevel faces still bound the visible jaw silhouette.
        if (front < 1e-7) continue;
        const silhouette = edge.normals.length === 1 || back < -1e-7;
        if (!silhouette && (!edge.crease || size < 0.09)) continue;
        writeStroke(silhouette && size > 0.16 ? 'contour' : 'detail', edge.stroke, mesh.matrixWorld);
        if (silhouette && edge.echo) writeStroke('echo', edge.echo, mesh.matrixWorld);
      }
    }
    for (const { parent, stroke } of construction) writeStroke('construction', stroke, parent.matrixWorld);
    for (const bucket of bucketList) {
      const geometry = bucket.line.geometry;
      bucket.line.visible = bucket.count > 0;
      geometry.instanceCount = bucket.count;
      if (!bucket.count) continue;
      for (const name of ['instanceStart', 'instanceColorStart']) {
        const buffer = geometry.attributes[name].data;
        buffer.clearUpdateRanges();
        buffer.addUpdateRange(0, bucket.count * 6);
        buffer.needsUpdate = true;
      }
    }
  }
  return { group, update, dispose() {
    Object.values(buckets).forEach(bucket => bucket.line.geometry.dispose());
    Object.values(materials).forEach(strokeMaterial => strokeMaterial.dispose());
  } };
}
