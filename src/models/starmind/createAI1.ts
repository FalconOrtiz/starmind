import * as THREE from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { PartId } from "../../data/specs";
import { AI1 } from "../../data/specs";
import { createCraftMaterials, type CraftMaterials } from "./materials";

export interface AI1Handle {
  group: THREE.Group;
  parts: Map<PartId, THREE.Object3D[]>;
  materials: CraftMaterials;
  update: (time: number, sunDir: THREE.Vector3) => void;
}

function tag(obj: THREE.Object3D, id: PartId, parts: Map<PartId, THREE.Object3D[]>): void {
  obj.userData.partId = id;
  obj.traverse((child) => {
    child.userData.partId = id;
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  const list = parts.get(id) ?? [];
  list.push(obj);
  parts.set(id, list);
}

function box(w: number, h: number, d: number, mat: THREE.Material, r = 0.03): THREE.Mesh {
  const geo =
    r > 0
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) * 0.2))
      : new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geo, mat);
}

/**
 * Official AI1 from spacex.com/spacexai/starmind (Overview / Thermal / Solar):
 *  - White louvered liquid radiator, 30 m, turned 90° to the solar plane
 *  - Silver compute / data bay at the crossing (Thermal hub)
 *  - Two dark solar wings, three horizontal bands, structural cross at mid
 */
export function createAI1(): AI1Handle {
  const mats = createCraftMaterials();
  const group = new THREE.Group();
  group.name = "AI1";
  const parts = new Map<PartId, THREE.Object3D[]>();

  const RAD_SPAN = 5.2;
  const RAD_H = AI1.deployedHeightM;
  const RAD_T = 0.34;
  const HUB_Y = RAD_H / 2;
  const WING_H = 22.2;
  const CENTER_GAP = 3.2;
  const WING_W = (AI1.wingspanM - CENTER_GAP) / 2;

  addRadiator(group, mats, parts, RAD_SPAN, RAD_H, RAD_T);
  addHub(group, mats, parts, HUB_Y);
  addSolarWings(group, mats, parts, CENTER_GAP, HUB_Y, WING_W, WING_H);

  return {
    group,
    parts,
    materials: mats,
    update: (time, _sunDir) => {
      mats.laserLens.emissiveIntensity = 2.0 + 0.4 * Math.sin(time * 3.1);
    },
  };
}

function addRadiator(
  group: THREE.Group,
  mats: CraftMaterials,
  parts: Map<PartId, THREE.Object3D[]>,
  span: number,
  h: number,
  t: number
): void {
  const rad = new THREE.Group();
  rad.name = "Radiator";
  rad.position.y = h / 2;
  rad.rotation.y = Math.PI / 2;

  const leafW = span / 2 - 0.045;
  for (const side of [-1, 1]) {
    const leaf = box(leafW, h, t, mats.radiator, 0.015);
    leaf.position.x = side * (leafW / 2 + 0.04);
    rad.add(leaf);

    for (let i = -18; i <= 18; i++) {
      const fin = box(leafW - 0.06, 0.028, t + 0.05, mats.white, 0.004);
      fin.position.set(side * (leafW / 2 + 0.04), i * 0.78, 0);
      rad.add(fin);
    }
  }

  const split = box(0.07, h, t + 0.03, mats.silverDark, 0.008);
  rad.add(split);

  const boomTop = box(0.16, 1.35, 0.16, mats.silver, 0.025);
  boomTop.position.y = h / 2 + 0.52;
  rad.add(boomTop);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 10), mats.silverPolish);
  spike.position.y = h / 2 + 1.38;
  rad.add(spike);

  const boomBot = box(0.16, 1.05, 0.16, mats.silver, 0.025);
  boomBot.position.y = -h / 2 - 0.38;
  rad.add(boomBot);

  group.add(rad);
  tag(rad, "radiator", parts);
}

function addHub(group: THREE.Group, mats: CraftMaterials, parts: Map<PartId, THREE.Object3D[]>, hubY: number): void {
  const hub = new THREE.Group();
  hub.name = "ComputeHub";
  hub.position.y = hubY;

  const chassis = box(3.35, 1.42, 2.05, mats.silver, 0.32);
  hub.add(chassis);
  tag(chassis, "compute-core", parts);

  const endL = new THREE.Mesh(new THREE.SphereGeometry(0.71, 20, 14), mats.silver);
  endL.scale.set(0.55, 1, 1.05);
  endL.position.x = -1.55;
  hub.add(endL);
  const endR = endL.clone();
  endR.position.x = 1.55;
  hub.add(endR);

  const inner = box(2.7, 1.05, 1.55, mats.silverDark, 0.12);
  hub.add(inner);

  for (let i = 0; i < 7; i++) {
    const blade = box(2.45, 0.07, 1.42, mats.silverPolish, 0.012);
    blade.position.y = -0.42 + i * 0.14;
    hub.add(blade);
    const slot = box(2.35, 0.018, 1.32, mats.gold, 0.004);
    slot.position.y = -0.36 + i * 0.14;
    hub.add(slot);
  }

  for (const face of [-1, 1]) {
    const panel = box(2.05, 1.15, 0.04, mats.silver, 0.02);
    panel.position.z = face * 1.3;
    hub.add(panel);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        const port = box(0.09, 0.07, 0.05, mats.silverDark, 0.008);
        port.position.set(-0.78 + c * 0.22, 0.38 - r * 0.22, face * 1.34);
        hub.add(port);
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), mats.gold);
        pin.rotation.x = Math.PI / 2;
        pin.position.set(-0.78 + c * 0.22, 0.38 - r * 0.22, face * 1.375);
        hub.add(pin);
      }
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 10; c++) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), mats.silverPolish);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(-0.95 + c * 0.21, -0.72 + r * 0.18, face * 1.33);
        hub.add(bolt);
      }
    }
  }

  for (const x of [-1.15, 1.15]) {
    const grill = box(0.08, 1.2, 1.7, mats.silverDark, 0.01);
    grill.position.x = x;
    hub.add(grill);
    for (let i = 0; i < 9; i++) {
      const slat = box(0.02, 0.06, 1.55, mats.silver, 0.004);
      slat.position.set(x + Math.sign(x) * 0.04, -0.5 + i * 0.13, 0);
      hub.add(slat);
    }
  }

  for (const z of [-1, 1]) {
    for (const x of [-0.55, 0.55]) {
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.38, 16), mats.silver);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(x, 0.55, z * 1.15);
      hub.add(pump);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), mats.silverPolish);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(x, 0.55, z * 1.36);
      hub.add(cap);
      const hose = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 18), mats.gold);
      hose.position.set(x, 0.55, z * 1.15);
      hub.add(hose);
    }
  }

  for (const z of [-1, 1]) {
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.1, 10), mats.gold);
    manifold.rotation.z = Math.PI / 2;
    manifold.position.set(0, 0.72, z * 1.18);
    hub.add(manifold);
  }
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 10), mats.gold);
  riser.position.set(0, 0.2, 0);
  hub.add(riser);

  const beamX = box(6.4, 0.18, 0.18, mats.silverPolish, 0.03);
  hub.add(beamX);
  const beamZ = box(0.18, 0.18, 3.4, mats.silverPolish, 0.03);
  hub.add(beamZ);
  const beamY = box(0.16, 2.6, 0.16, mats.silver, 0.025);
  hub.add(beamY);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const brace = box(1.35, 0.06, 0.06, mats.silverDark, 0.01);
      brace.position.set(sx * 0.85, 0, sz * 0.7);
      brace.rotation.y = sx * sz * 0.55;
      hub.add(brace);
    }
  }

  for (const x of [-1, 1]) {
    const yoke = box(0.85, 0.62, 0.72, mats.silver, 0.04);
    yoke.position.x = x * 1.85;
    hub.add(yoke);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 14), mats.silverPolish);
    collar.rotation.z = Math.PI / 2;
    collar.position.x = x * 1.55;
    hub.add(collar);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 12), mats.gold);
    pin.rotation.z = Math.PI / 2;
    pin.position.x = x * 1.7;
    hub.add(pin);
  }

  const spots: [number, number, number][] = [
    [0.85, 0.98, 0.85],
    [-0.85, 0.98, 0.85],
    [0.85, 0.98, -0.85],
    [-0.85, 0.98, -0.85],
  ];
  for (const [x, y, z] of spots) {
    const turret = new THREE.Group();
    turret.position.set(x, y, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.1, 16), mats.silver);
    turret.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 16), mats.gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    turret.add(ring);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), mats.laserLens);
    lens.position.y = 0.09;
    turret.add(lens);
    hub.add(turret);
    tag(turret, "laser-terminal", parts);
  }

  for (const [x, z] of [
    [1.25, 1.15],
    [-1.25, 1.15],
    [1.25, -1.15],
    [-1.25, -1.15],
  ]) {
    const pod = box(0.2, 0.2, 0.2, mats.silverDark, 0.025);
    pod.position.set(x, -0.72, z);
    hub.add(pod);
    tag(pod, "thruster", parts);
  }

  const plate = box(0.85, 0.12, 0.02, mats.silverPolish, 0.008);
  plate.position.set(0, 0.78, 1.29);
  hub.add(plate);

  const star = box(0.22, 0.14, 0.18, mats.darkGlass, 0.02);
  star.position.set(0.95, 0.82, 1.15);
  hub.add(star);

  group.add(hub);
  tag(hub, "bus", parts);
}

function addSolarWings(
  group: THREE.Group,
  mats: CraftMaterials,
  parts: Map<PartId, THREE.Object3D[]>,
  radT: number,
  hubY: number,
  wingW: number,
  wingH: number
): void {
  const thick = 0.085;
  const bands = 3;
  const bandH = (wingH - 0.18) / bands;
  const seam = 0.06;

  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * (radT / 2 + wingW / 2), hubY, 0);

    const boom = box(wingW + 0.2, 0.16, 0.2, mats.silverPolish, 0.02);
    wing.add(boom);

    const cross = box(0.14, wingH + 0.15, 0.14, mats.silver, 0.02);
    cross.position.x = -side * (wingW / 2 - 0.4);
    wing.add(cross);

    for (const s of [-1, 1]) {
      const diag = box(1.8, 0.055, 0.055, mats.silverDark, 0.008);
      diag.position.set(-side * (wingW / 2 - 1.1), s * 0.85, 0);
      diag.rotation.z = s * side * 0.55;
      wing.add(diag);
    }

    for (let b = 0; b < bands; b++) {
      const y = -wingH / 2 + seam + bandH / 2 + b * bandH;
      const panel = box(wingW, bandH - seam, thick, mats.solar, 0.01);
      panel.position.y = y;
      wing.add(panel);

      const railL = box(0.055, bandH - seam, thick + 0.03, mats.silver, 0.006);
      railL.position.set(-wingW / 2, y, 0);
      wing.add(railL);
      const railR = railL.clone();
      railR.position.x = wingW / 2;
      wing.add(railR);
    }

    for (let s = 1; s < bands; s++) {
      const y = -wingH / 2 + s * bandH;
      const join = box(wingW + 0.1, 0.09, 0.14, mats.silver, 0.01);
      join.position.y = y;
      wing.add(join);
      for (let k = 0; k < 14; k++) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), mats.gold);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(-wingW / 2 + 1.2 + k * ((wingW - 2.4) / 13), y, 0.08);
        wing.add(bolt);
      }
    }

    const tip = box(0.11, wingH + 0.08, 0.11, mats.white, 0.018);
    tip.position.x = side * (wingW / 2 + 0.02);
    wing.add(tip);

    const root = box(0.28, 0.85, 0.6, mats.silver, 0.035);
    root.position.x = -side * (wingW / 2);
    wing.add(root);

    group.add(wing);
    tag(wing, "solar-wing", parts);
  }
}
