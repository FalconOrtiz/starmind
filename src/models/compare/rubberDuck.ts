import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DUCK_DIM } from "../../data/comparisons";

const YELLOW = 0xf6d23a;
const ORANGE = 0xf26a21;
const WHITE = 0xffffff;
const BLACK = 0x111111;

const HEAD = { x: 0.018, y: 0.063, z: 0, r: 0.02 };

function paint(geo: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function xform(
  geo: THREE.BufferGeometry,
  hex: number,
  px: number,
  py: number,
  pz: number,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.BufferGeometry {
  const g = geo.clone();
  g.scale(sx, sy, sz);
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(px, py, pz);
  return paint(g, hex);
}

function eyeDisk(hex: number, px: number, py: number, pz: number, radius: number, depth: number): THREE.BufferGeometry {
  const dx = px - HEAD.x;
  const dy = py - HEAD.y;
  const dz = pz - HEAD.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const nz = dz / len;
  const g = new THREE.SphereGeometry(radius, 16, 12);
  g.scale(depth, 1, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(nx, ny, nz));
  g.applyQuaternion(q);
  g.translate(px, py, pz);
  return paint(g, hex);
}

export function createDuckGeometry(): THREE.BufferGeometry {
  const parts = [
    xform(new THREE.SphereGeometry(0.034, 28, 20), YELLOW, 0, 0.032, 0, 1.28, 0.95, 1.08),
    xform(new THREE.SphereGeometry(0.02, 24, 18), YELLOW, HEAD.x, HEAD.y, HEAD.z),
    xform(new THREE.SphereGeometry(0.021, 12, 10), YELLOW, 0.016, 0.038, 0, 1.15, 0.85, 1),
    xform(new THREE.ConeGeometry(0.009, 0.016, 10), ORANGE, 0.036, 0.06, 0, 1, 1, 1, 0, 0, -Math.PI / 2),
    xform(new THREE.SphereGeometry(0.008, 10, 8), ORANGE, 0.03, 0.059, 0, 1.25, 0.7, 1.15),
    xform(new THREE.SphereGeometry(0.012, 10, 8), YELLOW, -0.03, 0.04, 0, 0.85, 0.7, 0.55),
    xform(new THREE.SphereGeometry(0.012, 10, 8), YELLOW, 0, 0.034, 0.028, 0.7, 0.45, 0.35, 0, 0.4, 0),
    xform(new THREE.SphereGeometry(0.012, 10, 8), YELLOW, 0, 0.034, -0.028, 0.7, 0.45, 0.35, 0, -0.4, 0),
    eyeDisk(WHITE, 0.0372, 0.0712, 0.0112, 0.0066, 0.38),
    eyeDisk(WHITE, 0.0372, 0.0712, -0.0112, 0.0066, 0.38),
    eyeDisk(BLACK, 0.0414, 0.0718, 0.0094, 0.0035, 0.42),
    eyeDisk(BLACK, 0.0414, 0.0718, -0.0094, 0.0035, 0.42),
    eyeDisk(WHITE, 0.043, 0.0738, 0.0082, 0.00115, 0.5),
    eyeDisk(WHITE, 0.043, 0.0738, -0.0082, 0.00115, 0.5),
  ];
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.SphereGeometry(0.034, 12, 10);
  merged.computeVertexNormals();
  return merged;
}

export function createDuckMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xffee88),
  });
}

function addEyePair(parent: THREE.Group, white: THREE.Material, black: THREE.Material): void {
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0068, 18, 14), white);
    eye.position.set(0.0374, 0.0714, 0.0112 * side);
    parent.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0036, 14, 12), black);
    pupil.position.set(0.0418, 0.072, 0.0094 * side);
    parent.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.00125, 10, 8), white);
    glint.position.set(0.0436, 0.0742, 0.0082 * side);
    parent.add(glint);
  }
}

export function createRubberDuck(scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = "RubberDuck";
  const y = new THREE.MeshPhysicalMaterial({
    color: YELLOW,
    roughness: 0.28,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffee88),
  });
  const o = new THREE.MeshPhysicalMaterial({
    color: ORANGE,
    roughness: 0.35,
    metalness: 0.04,
    clearcoat: 0.45,
  });
  const black = new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.32 });
  const white = new THREE.MeshPhysicalMaterial({
    color: WHITE,
    roughness: 0.18,
    clearcoat: 0.55,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.034, 40, 28), y);
  body.scale.set(1.25, 0.95, 1.05);
  body.position.set(0, 0.032, 0);
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 24), y);
  head.position.set(HEAD.x, HEAD.y, HEAD.z);
  g.add(head);

  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.021, 16, 12), y);
  cheek.scale.set(1.15, 0.85, 1);
  cheek.position.set(0.016, 0.038, 0);
  g.add(cheek);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.016, 12), o);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.036, 0.06, 0);
  g.add(beak);
  const beakBase = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 10), o);
  beakBase.scale.set(1.25, 0.7, 1.15);
  beakBase.position.set(0.03, 0.059, 0);
  g.add(beakBase);

  addEyePair(g, white, black);

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), y);
  tail.scale.set(0.8, 0.7, 0.55);
  tail.position.set(-0.03, 0.04, 0);
  g.add(tail);

  for (const side of [1, -1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), y);
    wing.scale.set(0.7, 0.45, 0.35);
    wing.position.set(0, 0.034, 0.028 * side);
    wing.rotation.y = 0.4 * side;
    g.add(wing);
  }

  g.scale.setScalar(scale);
  g.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return g;
}

export const DUCK_HALF = new THREE.Vector3(DUCK_DIM.l / 2, DUCK_DIM.h / 2, DUCK_DIM.w / 2);
