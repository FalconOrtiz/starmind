import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TESLA_DIM } from "../../data/comparisons";

const L = TESLA_DIM.l;
const W = TESLA_DIM.w;
const H = TESLA_DIM.h;
const WHEEL_R = 0.335;
const WHEEL_W = 0.225;
const WB = 2.875;

const BODY = 0xeceff3;
const BLACK = 0x161616;
const GLASS = 0x4a5c6c;
const LIGHT = 0xe8eef6;
const TAIL = 0xcc1c1c;
const CHROME = 0xb4b8bc;
const TIRE = 0x141414;

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
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  if (rz) g.rotateZ(rz);
  g.translate(px, py, pz);
  return paint(g, hex);
}

export function createTeslaGeometry(): THREE.BufferGeometry {
  const axleZ = W / 2 - 0.2;
  const parts: THREE.BufferGeometry[] = [
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, 0, 0.42, 0, L * 0.97, 0.22, W * 0.97),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, 0, 0.64, 0, L * 0.94, 0.34, W * 0.94),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, -0.06, 0.96, 0, L * 0.58, 0.38, W * 0.88),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, 1.32, 0.76, 0, 1.22, 0.1, W * 0.88, 0, 0, -0.04),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, -1.46, 0.76, 0, 0.98, 0.1, W * 0.88),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, L / 2 - 0.08, 0.4, 0, 0.18, 0.22, W * 0.9),
    xform(new THREE.BoxGeometry(1, 1, 1), BODY, -L / 2 + 0.07, 0.4, 0, 0.16, 0.2, W * 0.9),
    xform(new THREE.BoxGeometry(1, 1, 1), GLASS, 0.66, 0.98, 0, 0.98, 0.4, W * 0.82, 0, 0, -0.4),
    xform(new THREE.BoxGeometry(1, 1, 1), GLASS, -0.16, 1.18, 0, 1.58, 0.035, W * 0.8),
    xform(new THREE.BoxGeometry(1, 1, 1), GLASS, -1.14, 1.0, 0, 0.72, 0.3, W * 0.8, 0, 0, 0.36),
    xform(new THREE.BoxGeometry(1, 1, 1), LIGHT, L / 2 - 0.03, 0.64, 0, 0.05, 0.045, 1.42),
    xform(new THREE.BoxGeometry(1, 1, 1), TAIL, -L / 2 + 0.03, 0.72, 0, 0.04, 0.035, 1.28),
    xform(new THREE.BoxGeometry(1, 1, 1), CHROME, -L / 2 + 0.02, 0.46, 0, 0.02, 0.1, 0.32),
    xform(new THREE.BoxGeometry(1, 1, 1), BLACK, -0.55, 0.7, W / 2 - 0.02, 0.08, 0.1, 0.04),
  ];

  for (const z of [-W * 0.445, W * 0.445]) {
    parts.push(
      xform(new THREE.BoxGeometry(1, 1, 1), GLASS, -0.08, 0.94, z, 1.72, 0.3, 0.035),
      xform(new THREE.BoxGeometry(1, 1, 1), BLACK, -0.08, 0.78, z, 1.76, 0.02, 0.02),
      xform(new THREE.BoxGeometry(1, 1, 1), BLACK, 0, 0.32, z, L * 0.72, 0.07, 0.045),
      xform(new THREE.BoxGeometry(1, 1, 1), BLACK, 0.64, 0.9, z + Math.sign(z) * 0.07, 0.15, 0.085, 0.2)
    );
  }

  for (const x of [WB / 2, -WB / 2]) {
    for (const z of [-axleZ, axleZ]) {
      parts.push(
        xform(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 12), TIRE, x, WHEEL_R, z, 1, 1, 1, 0, 0, Math.PI / 2),
        xform(new THREE.CylinderGeometry(WHEEL_R * 0.62, WHEEL_R * 0.62, WHEEL_W + 0.01, 10), BLACK, x, WHEEL_R, z, 1, 1, 1, 0, 0, Math.PI / 2),
        xform(new THREE.CylinderGeometry(0.06, 0.06, WHEEL_W + 0.02, 8), CHROME, x, WHEEL_R, z, 1, 1, 1, 0, 0, Math.PI / 2)
      );
    }
  }

  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.BoxGeometry(L, H, W);
  merged.computeVertexNormals();
  merged.translate(0, -H / 2, 0);
  return merged;
}

export function createTeslaMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.28,
    envMapIntensity: 0.35,
  });
}

export const TESLA_HALF = new THREE.Vector3(TESLA_DIM.l / 2, TESLA_DIM.h / 2, TESLA_DIM.w / 2);
