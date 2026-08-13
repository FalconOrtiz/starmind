import * as THREE from "three/webgpu";
import { COMPARISONS, type ComparisonId } from "../data/comparisons";
import { FieldPhysics } from "../physics/fieldPhysics";
import { createFootballPitch } from "../models/compare/footballPitch";
import { createTeslaGeometry, createTeslaMaterial, TESLA_HALF } from "../models/compare/teslaModel3";
import { createDuckGeometry, createDuckMaterial, createRubberDuck, DUCK_HALF } from "../models/compare/rubberDuck";
import { createHuman, createHumanGeometry, createHumanMaterial, HUMAN_HALF } from "../models/compare/human";

export interface ScalePark {
  group: THREE.Group;
  physics: FieldPhysics;
  setComparison: (id: ComparisonId) => void;
  update: (dt: number) => void;
  poke: (origin: THREE.Vector3, dir: THREE.Vector3, impulse: number) => number;
  activeKind: () => "tesla" | "human" | "duck" | null;
}

export function createScalePark(): ScalePark {
  const group = new THREE.Group();
  group.name = "ScalePark";
  const physics = new FieldPhysics();

  const pitch = createFootballPitch();
  pitch.position.y = 0.01;
  group.add(pitch);

  const humanRef = createHuman();
  humanRef.position.set(12.5, 0, 10);
  group.add(humanRef);

  const teslaRoot = new THREE.Group();
  teslaRoot.name = "TeslaSet";
  teslaRoot.visible = false;
  group.add(teslaRoot);

  const teslaDef = COMPARISONS.tesla;
  const teslaGeo = createTeslaGeometry();
  const teslaMat = createTeslaMaterial();
  const teslaCount = teslaDef.lineCount + teslaDef.stackCount;
  const teslaInst = new THREE.InstancedMesh(teslaGeo, teslaMat, teslaCount);
  teslaInst.castShadow = true;
  teslaInst.receiveShadow = true;
  teslaInst.frustumCulled = false;
  teslaRoot.add(teslaInst);

  const teslaLineZ = 26;
  const teslaStart = -((teslaDef.lineCount - 1) * teslaDef.lengthM) / 2;
  let tid = 0;
  for (let i = 0; i < teslaDef.lineCount; i++) {
    const x = teslaStart + i * teslaDef.lengthM;
    const y = teslaDef.heightM / 2;
    physics.addInstance("tesla", tid++, x, y, teslaLineZ, TESLA_HALF, 1611);
  }
  const teslaTowerX = 44;
  const teslaTowerZ = -22;
  for (let i = 0; i < teslaDef.stackCount; i++) {
    const y = teslaDef.heightM / 2 + i * teslaDef.heightM;
    physics.addInstance("tesla", tid++, teslaTowerX, y, teslaTowerZ, TESLA_HALF, 1611);
  }
  physics.registerInstanced("tesla", teslaInst);

  const humanRoot = new THREE.Group();
  humanRoot.name = "HumanSet";
  humanRoot.visible = false;
  group.add(humanRoot);

  const humanDef = COMPARISONS.human;
  const humanGeo = createHumanGeometry();
  const humanMat = createHumanMaterial();
  const humanCount = humanDef.lineCount + humanDef.stackCount;
  const humanInst = new THREE.InstancedMesh(humanGeo, humanMat, humanCount);
  humanInst.castShadow = true;
  humanInst.receiveShadow = true;
  humanInst.frustumCulled = false;
  humanRoot.add(humanInst);

  const humanLineZ = 26;
  const humanStart = -((humanDef.lineCount - 1) * humanDef.lengthM) / 2;
  let hid = 0;
  for (let i = 0; i < humanDef.lineCount; i++) {
    const x = humanStart + i * humanDef.lengthM;
    const y = humanDef.heightM / 2;
    physics.addInstance("human", hid++, x, y, humanLineZ, HUMAN_HALF, 78);
  }
  const humanTowerX = 44;
  const humanTowerZ = -22;
  for (let i = 0; i < humanDef.stackCount; i++) {
    const y = humanDef.heightM / 2 + i * humanDef.heightM;
    physics.addInstance("human", hid++, humanTowerX, y, humanTowerZ, HUMAN_HALF, 78);
  }
  physics.registerInstanced("human", humanInst);

  const duckRoot = new THREE.Group();
  duckRoot.name = "DuckSet";
  duckRoot.visible = false;
  group.add(duckRoot);

  const duckDef = COMPARISONS.duck;
  const duckGeo = createDuckGeometry();
  const duckMat = createDuckMaterial();
  const duckCount = duckDef.lineCount + duckDef.stackCount;
  const duckInst = new THREE.InstancedMesh(duckGeo, duckMat, duckCount);
  duckInst.castShadow = true;
  duckInst.receiveShadow = true;
  duckInst.frustumCulled = false;
  duckRoot.add(duckInst);

  const duckLineZ = 20;
  const duckStart = -((duckDef.lineCount - 1) * duckDef.lengthM) / 2;
  let did = 0;
  for (let i = 0; i < duckDef.lineCount; i++) {
    const x = duckStart + i * duckDef.lengthM;
    const y = duckDef.heightM / 2;
    physics.addInstance("duck", did++, x, y, duckLineZ, DUCK_HALF, 0.085);
  }
  const duckTowerX = 42;
  const duckTowerZ = 18;
  for (let i = 0; i < duckDef.stackCount; i++) {
    const y = duckDef.heightM / 2 + i * duckDef.heightM;
    physics.addInstance("duck", did++, duckTowerX, y, duckTowerZ, DUCK_HALF, 0.085);
  }
  physics.registerInstanced("duck", duckInst);

  const heroDuck = createRubberDuck(1);
  heroDuck.position.set(0.0, 0, 20.12);
  heroDuck.name = "HeroDuck";
  duckRoot.add(heroDuck);

  let active: ComparisonId = "pitch";

  const kindOf = (id: ComparisonId): "tesla" | "human" | "duck" | null => {
    if (id === "tesla" || id === "human" || id === "duck") return id;
    return null;
  };

  const setComparison = (id: ComparisonId) => {
    const prev = kindOf(active);
    if (prev) physics.reset(prev);
    active = id;
    teslaRoot.visible = id === "tesla";
    humanRoot.visible = id === "human";
    duckRoot.visible = id === "duck";
    humanRef.visible = id === "pitch";
    const k = kindOf(id);
    if (k) physics.reset(k);
  };

  setComparison("pitch");

  return {
    group,
    physics,
    setComparison,
    update: (dt) => {
      physics.update(dt, kindOf(active));
    },
    poke: (origin, dir, impulse) => {
      const k = kindOf(active);
      if (!k) return 0;
      const radius = k === "duck" ? 2.6 : k === "human" ? 1.8 : 4.2;
      return physics.pokeRay(origin, dir, k, radius, impulse);
    },
    activeKind: () => kindOf(active),
  };
}
