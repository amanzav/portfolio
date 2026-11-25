import * as THREE from 'three';

export function createArmModel() {
  const arm = new THREE.Group();
  arm.name = 'arm';
  const shell = new THREE.MeshStandardMaterial({ color: 0xe8e8e3, roughness: 0.74, metalness: 0.08 });
  const face = new THREE.MeshStandardMaterial({ color: 0xf6f5ef, roughness: 0.78, metalness: 0.04 });
  const alloy = new THREE.MeshStandardMaterial({ color: 0xb0b4b2, roughness: 0.55, metalness: 0.48 });
  const seam = new THREE.MeshStandardMaterial({ color: 0x62696a, roughness: 0.82, metalness: 0.18 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x343a3b, roughness: 0.96 });

  function part(geometry, material, parent, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function group(name, parent, x = 0, y = 0, z = 0) {
    const node = new THREE.Group();
    node.name = name;
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  }

  function cylinder(radius, height, material, parent, x = 0, y = 0, z = 0, axis = 'y', bottom = radius) {
    const mesh = part(new THREE.CylinderGeometry(radius, bottom, height, 48, 1), material, parent, x, y, z);
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    return mesh;
  }

  function bolt(parent, x, y, z, axis = 'z', size = 0.042) {
    const mesh = part(new THREE.CylinderGeometry(size, size, 0.025, 6), alloy, parent, x, y, z);
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    const slot = part(new THREE.BoxGeometry(size * 0.92, size * 0.14, 0.003), seam, mesh, 0, 0.014, 0);
    slot.rotation.x = Math.PI / 2;
    return mesh;
  }

  function profile(points, depth, bevel = 0.04) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 3, bevelSize: bevel,
      bevelThickness: bevel, curveSegments: 12, steps: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }

  function housing(parent, length, width, depth) {
    const points = [
      [0.04, -width * 0.38], [0.25, -width * 0.5],
      [length * 0.72, -width * 0.32], [length - 0.04, -width * 0.26],
      [length + 0.05, -width * 0.12], [length + 0.05, width * 0.12],
      [length - 0.04, width * 0.26], [length * 0.72, width * 0.32],
      [0.25, width * 0.5], [0.04, width * 0.38],
    ];
    part(profile(points, depth, 0.055), shell, parent);
    const inset = [
      [0.3, -width * 0.32], [length - 0.27, -width * 0.19],
      [length - 0.18, 0], [length - 0.27, width * 0.19],
      [0.3, width * 0.32], [0.23, 0],
    ];
    for (const side of [-1, 1]) {
      part(profile(inset, 0.012, 0.014), seam, parent, 0, 0, side * (depth / 2 + 0.056));
      const panel = inset.map(([x, y]) => [x, y * 0.92]);
      part(profile(panel, 0.016, 0.012), face, parent, 0, 0, side * (depth / 2 + 0.071));
      bolt(parent, 0.35, width * 0.22, side * (depth / 2 + 0.1), 'z', 0.026);
      bolt(parent, 0.35, -width * 0.22, side * (depth / 2 + 0.1), 'z', 0.026);
      bolt(parent, length - 0.34, 0, side * (depth / 2 + 0.1), 'z', 0.026);
    }
  }

  function joint(parent, radius, depth) {
    cylinder(radius * 0.94, depth + 0.07, seam, parent, 0, 0, 0, 'z');
    cylinder(radius, depth, shell, parent, 0, 0, 0, 'z');
    for (const side of [-1, 1]) {
      cylinder(radius * 0.87, 0.032, alloy, parent, 0, 0, side * (depth / 2 + 0.023), 'z');
      cylinder(radius * 0.8, 0.045, face, parent, 0, 0, side * (depth / 2 + 0.054), 'z');
      cylinder(radius * 0.31, 0.008, shell, parent, 0, 0, side * (depth / 2 + 0.081), 'z');
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        bolt(parent, Math.cos(a) * radius * 0.65, Math.sin(a) * radius * 0.65,
          side * (depth / 2 + 0.085), 'z', radius * 0.064);
      }
    }
  }

  function cable(parent, points, radius = 0.035) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return part(new THREE.TubeGeometry(curve, 40, radius, 8, false), rubber, parent);
  }

  const base = group('base', arm);
  cylinder(0.75, 0.09, alloy, base, 0, 0.045);
  cylinder(0.71, 0.055, face, base, 0, 0.115);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    bolt(base, Math.cos(a) * 0.61, 0.158, Math.sin(a) * 0.61, 'y', 0.05);
  }
  cylinder(0.46, 0.28, shell, base, 0, 0.29, 0, 'y', 0.5);
  const turret = group('turret', base);
  cylinder(0.465, 0.035, seam, turret, 0, 0.448);
  cylinder(0.47, 0.055, alloy, turret, 0, 0.49);
  cylinder(0.43, 0.1, face, turret, 0, 0.566);
  part(profile([
    [-0.32, 0.56], [0.3, 0.56], [0.34, 0.83], [0.24, 1.02],
    [-0.24, 1.02], [-0.34, 0.83],
  ], 0.51, 0.04), shell, turret);

  const shoulder = group('shoulder', turret, 0, 0.85);
  shoulder.rotation.z = 0.98;
  joint(shoulder, 0.38, 0.64);
  cylinder(0.29, 0.22, alloy, shoulder, 0, 0, -0.42, 'z');
  cylinder(0.285, 0.13, shell, shoulder, 0, 0, -0.58, 'z');
  housing(shoulder, 2.15, 0.63, 0.42);
  cable(shoulder, [[0.14, 0.16, -0.52], [0.38, 0.52, -0.47], [1.1, 0.48, -0.42], [1.85, 0.3, -0.4], [2.12, 0.08, -0.38]]);
  for (const x of [0.65, 1.45]) {
    cylinder(0.06, 0.13, alloy, shoulder, x, 0.35, -0.41, 'z');
  }

  const elbow = group('elbow', shoulder, 2.15);
  elbow.rotation.z = 1.45;
  joint(elbow, 0.34, 0.65);
  housing(elbow, 2.05, 0.47, 0.34);
  cable(elbow, [[0.08, 0.22, -0.4], [0.22, 0.48, -0.38], [0.6, 0.44, -0.32], [1.45, 0.32, -0.29], [1.94, 0.12, -0.27]], 0.027);

  const wrist = group('wrist', elbow, 2.05);
  wrist.rotation.z = 0.62;
  joint(wrist, 0.225, 0.43);
  cylinder(0.18, 0.31, alloy, wrist, 0.19, 0, 0, 'x');
  cylinder(0.191, 0.04, seam, wrist, 0.35, 0, 0, 'x');
  cylinder(0.2, 0.11, face, wrist, 0.405, 0, 0, 'x');
  cylinder(0.21, 0.045, alloy, wrist, 0.48, 0, 0, 'x');

  const gripper = group('gripper', wrist, 0.51);
  group('gripPoint', gripper, 0.75);
  part(profile([[0, -0.17], [0.25, -0.18], [0.32, -0.12], [0.32, 0.12], [0.25, 0.18], [0, 0.17]], 0.27, 0.018), shell, gripper);
  part(new THREE.BoxGeometry(0.13, 0.29, 0.025), seam, gripper, 0.15, 0, 0.155);
  part(new THREE.BoxGeometry(0.1, 0.25, 0.03), alloy, gripper, 0.15, 0, 0.172);
  for (const sign of [-1, 1]) {
    const finger = group(sign === 1 ? 'fingerUpper' : 'fingerLower', gripper, 0.33, sign * 0.13);
    const fingerProfile = [[0, -0.058], [0.13, -0.058], [0.31, 0.12], [0.48, 0.12], [0.48, 0.19], [0.27, 0.19], [0.08, 0.045], [0, 0.045]];
    part(profile(fingerProfile.map(([x, y]) => [x - 0.06, y]), 0.12, 0.012), alloy, finger);
    if (sign === -1) finger.scale.y = -1;
    cylinder(0.065, 0.16, shell, finger, 0, 0, 0, 'z');
    bolt(finger, 0, 0, 0.09, 'z', 0.028);
    const pad = part(new THREE.BoxGeometry(0.12, 0.036, 0.125), rubber, finger, 0.36, 0.115);
    pad.name = sign === 1 ? 'gripPadUpper' : 'gripPadLower';
  }

  arm.userData.dimensions = { shoulderHeight: 0.85, upper: 2.15, fore: 2.05, tool: 1.26 };
  arm.updateMatrixWorld(true);
  return arm;
}
