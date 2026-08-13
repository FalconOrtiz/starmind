import * as THREE from "three/webgpu";
import {
  busPanelTexture,
  mlITexture,
  radiatorTexture,
  solarCellTexture,
} from "./textures";

function canvasMap(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  return map;
}

export interface CraftMaterials {
  bus: THREE.MeshPhysicalMaterial;
  busTrim: THREE.MeshPhysicalMaterial;
  solar: THREE.MeshPhysicalMaterial;
  solarFrame: THREE.MeshPhysicalMaterial;
  radiator: THREE.MeshPhysicalMaterial;
  mli: THREE.MeshPhysicalMaterial;
  laser: THREE.MeshPhysicalMaterial;
  laserLens: THREE.MeshPhysicalMaterial;
  thruster: THREE.MeshPhysicalMaterial;
  gold: THREE.MeshPhysicalMaterial;
  white: THREE.MeshPhysicalMaterial;
  darkGlass: THREE.MeshPhysicalMaterial;
  silver: THREE.MeshPhysicalMaterial;
  silverDark: THREE.MeshPhysicalMaterial;
  silverPolish: THREE.MeshPhysicalMaterial;
}

export function createCraftMaterials(): CraftMaterials {
  const solarMap = canvasMap(solarCellTexture());
  const busMap = canvasMap(busPanelTexture());
  const mliMap = canvasMap(mlITexture());
  const radMap = canvasMap(radiatorTexture());

  return {
    bus: new THREE.MeshPhysicalMaterial({
      color: 0x8a9098,
      map: busMap,
      metalness: 0.78,
      roughness: 0.34,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
    }),
    busTrim: new THREE.MeshPhysicalMaterial({
      color: 0x2a2e34,
      metalness: 0.55,
      roughness: 0.42,
    }),
    solar: new THREE.MeshPhysicalMaterial({
      color: 0x1a3a62,
      map: solarMap,
      metalness: 0.92,
      roughness: 0.1,
      iridescence: 0.85,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [40, 340],
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.7,
    }),
    solarFrame: new THREE.MeshPhysicalMaterial({
      color: 0x8a9098,
      metalness: 0.9,
      roughness: 0.28,
    }),
    radiator: new THREE.MeshPhysicalMaterial({
      color: 0xe8eaed,
      map: radMap,
      metalness: 0.55,
      roughness: 0.28,
      emissive: 0x000000,
      emissiveIntensity: 0,
    }),
    mli: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: mliMap,
      metalness: 0.7,
      roughness: 0.35,
    }),
    laser: new THREE.MeshPhysicalMaterial({
      color: 0x1a1e24,
      metalness: 0.8,
      roughness: 0.25,
    }),
    laserLens: new THREE.MeshPhysicalMaterial({
      color: 0x66e8ff,
      emissive: 0x3ad4ff,
      emissiveIntensity: 2.4,
      metalness: 0.2,
      roughness: 0.08,
      transparent: true,
      opacity: 0.92,
    }),
    thruster: new THREE.MeshPhysicalMaterial({
      color: 0x3a4048,
      metalness: 0.88,
      roughness: 0.3,
    }),
    gold: new THREE.MeshPhysicalMaterial({
      color: 0xc4a056,
      metalness: 1,
      roughness: 0.22,
    }),
    white: new THREE.MeshPhysicalMaterial({
      color: 0xe8edf2,
      metalness: 0.15,
      roughness: 0.4,
    }),
    silver: new THREE.MeshPhysicalMaterial({
      color: 0xd8dee6,
      metalness: 1,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      envMapIntensity: 2.1,
    }),
    silverDark: new THREE.MeshPhysicalMaterial({
      color: 0x8a929a,
      metalness: 0.92,
      roughness: 0.32,
      envMapIntensity: 1.2,
    }),
    silverPolish: new THREE.MeshPhysicalMaterial({
      color: 0xe8eef4,
      metalness: 1,
      roughness: 0.08,
      clearcoat: 0.7,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.8,
    }),
    darkGlass: new THREE.MeshPhysicalMaterial({
      color: 0x6f8ea8,
      metalness: 0.05,
      roughness: 0.03,
      transmission: 0.78,
      thickness: 0.035,
      ior: 1.52,
      transparent: true,
      opacity: 0.9,
      attenuationColor: new THREE.Color(0x7ea0b8),
      attenuationDistance: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.5,
    }),
  };
}
