import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { HUMAN_HEIGHT_M, HUMAN_STANCE_M } from "../../data/comparisons";

const SKIN = 0xf3d4bc;
const SHIRT = 0xf7f7f7;
const PANTS = 0x6b7076;
const TIE = 0x141414;
const SHOE = 0x2a2a2c;

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
  sz = 1
): THREE.BufferGeometry {
  const g = geo.clone();
  g.scale(sx, sy, sz);
  g.translate(px, py, pz);
  return paint(g, hex);
}

export function createHumanGeometry(): THREE.BufferGeometry {
  const parts = [
    xform(new THREE.SphereGeometry(0.105, 14, 12), SKIN, 0, 1.64, 0),
    xform(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 8), SKIN, 0, 1.515, 0),
    xform(new THREE.CapsuleGeometry(0.165, 0.4, 5, 10), SHIRT, 0, 1.2, 0),
    xform(new THREE.BoxGeometry(0.045, 0.28, 0.02), TIE, 0, 1.28, 0.16),
    xform(new THREE.BoxGeometry(0.035, 0.035, 0.02), TIE, 0, 1.42, 0.165),
    xform(new THREE.SphereGeometry(0.155, 10, 8), PANTS, 0, 0.93, 0, 1, 0.52, 0.72),
    xform(new THREE.CapsuleGeometry(0.062, 0.58, 4, 8), PANTS, -0.09, 0.44, 0),
    xform(new THREE.CapsuleGeometry(0.062, 0.58, 4, 8), PANTS, 0.09, 0.44, 0),
    xform(new THREE.CapsuleGeometry(0.042, 0.48, 4, 8), SHIRT, -0.22, 1.22, 0),
    xform(new THREE.CapsuleGeometry(0.042, 0.48, 4, 8), SHIRT, 0.22, 1.22, 0),
    xform(new THREE.SphereGeometry(0.038, 8, 6), SKIN, -0.22, 0.94, 0),
    xform(new THREE.SphereGeometry(0.038, 8, 6), SKIN, 0.22, 0.94, 0),
    xform(new THREE.BoxGeometry(0.09, 0.055, 0.16), SHOE, -0.09, 0.04, 0.02),
    xform(new THREE.BoxGeometry(0.09, 0.055, 0.16), SHOE, 0.09, 0.04, 0.02),
  ];
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.CapsuleGeometry(0.2, 1.2, 4, 8);
  merged.computeVertexNormals();
  merged.translate(0, -HUMAN_HEIGHT_M / 2, 0);
  return merged;
}

export function createHumanMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.58,
    metalness: 0.04,
  });
}

export function createHuman(): THREE.Group {
  const g = new THREE.Group();
  g.name = "Human";
  const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55 });
  const shirt = new THREE.MeshStandardMaterial({ color: SHIRT, roughness: 0.45 });
  const pants = new THREE.MeshStandardMaterial({ color: PANTS, roughness: 0.62 });
  const tie = new THREE.MeshStandardMaterial({ color: TIE, roughness: 0.4 });
  const shoe = new THREE.MeshStandardMaterial({ color: SHOE, roughness: 0.5 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), skin);
  head.position.y = 1.64;
  g.add(head);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.4, 6, 12), shirt);
  torso.position.y = 1.2;
  g.add(torso);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), tie);
  knot.position.set(0, 1.42, 0.165);
  g.add(knot);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.02), tie);
  blade.position.set(0, 1.28, 0.16);
  g.add(blade);
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), pants);
  hips.scale.set(1, 0.52, 0.72);
  hips.position.y = 0.93;
  g.add(hips);
  for (const x of [-0.09, 0.09]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.58, 4, 8), pants);
    leg.position.set(x, 0.44, 0);
    g.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.48, 4, 8), shirt);
    arm.position.set(x * 2.45, 1.22, 0);
    g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), skin);
    hand.position.set(x * 2.45, 0.94, 0);
    g.add(hand);
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.16), shoe);
    ft.position.set(x, 0.04, 0.02);
    g.add(ft);
  }
  g.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) m.castShadow = true;
  });
  return g;
}

export const HUMAN_HALF = new THREE.Vector3(HUMAN_STANCE_M / 2, HUMAN_HEIGHT_M / 2, 0.22);
