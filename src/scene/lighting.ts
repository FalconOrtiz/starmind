import * as THREE from "three/webgpu";
import { vec3 } from "three/tsl";

export const COMPARE_SUN_POS = new THREE.Vector3(130, 95, 110);

/** Locked world direction — not attached to the camera or the HUD. */
export const FLIGHT_SUN_DIR = new THREE.Vector3(-0.276, 0.509, 0.815).normalize();
export const FLIGHT_SUN_DIST = 56000;
export const FLIGHT_SUN_POS = FLIGHT_SUN_DIR.clone().multiplyScalar(FLIGHT_SUN_DIST);

export interface LightRig {
  sun: THREE.DirectionalLight;
  sunDir: THREE.Vector3;
  hemi: THREE.HemisphereLight;
  fill: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  sunMesh: THREE.Group;
  setFlight: () => void;
  setCompare: () => void;
  follow: (target: THREE.Vector3, mode: "flight" | "compare", camera?: THREE.Camera) => void;
}

export function createLightRig(scene: THREE.Scene): LightRig {
  const sunDir = FLIGHT_SUN_DIR.clone();
  const _toSun = new THREE.Vector3();

  const hemi = new THREE.HemisphereLight(0x6ea0c8, 0x0c141c, 0.22);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d4, 4.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 900;
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);

  const fill = new THREE.DirectionalLight(0x6ea4d8, 0.28);
  fill.position.set(-80, 40, -60);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x9fd4ff, 0.45);
  rim.position.set(-40, 20, 80);
  scene.add(rim);

  const sunMesh = createSunStar();
  sunMesh.position.copy(FLIGHT_SUN_POS);
  scene.add(sunMesh);

  const applyShadow = (size: number, extent: number) => {
    sun.shadow.mapSize.set(size, size);
    sun.shadow.camera.left = -extent;
    sun.shadow.camera.right = extent;
    sun.shadow.camera.top = extent;
    sun.shadow.camera.bottom = -extent;
    sun.shadow.camera.updateProjectionMatrix();
  };

  return {
    sun,
    sunDir,
    hemi,
    fill,
    rim,
    sunMesh,
    setFlight: () => {
      hemi.color.set(0x6a90b8);
      hemi.groundColor.set(0x05070c);
      hemi.intensity = 0.14;
      sun.color.set(0xfff1d0);
      sun.intensity = 6.6;
      fill.intensity = 0;
      rim.intensity = 0;
      applyShadow(2048, 80);
      sunMesh.visible = true;
      sunMesh.scale.setScalar(1);
    },
    setCompare: () => {
      hemi.color.set(0xb8cce0);
      hemi.groundColor.set(0x2a3328);
      hemi.intensity = 0.48;
      sun.color.set(0xfff2dc);
      sun.intensity = 1.35;
      fill.intensity = 0.2;
      rim.intensity = 0.12;
      applyShadow(2048, 90);
      sunMesh.visible = false;
    },
    follow: (target, mode, camera) => {
      if (mode === "compare") {
        sun.position.copy(COMPARE_SUN_POS);
        sun.target.position.set(0, 8, 0);
        sun.target.updateMatrixWorld();
        sunDir.copy(COMPARE_SUN_POS).normalize();
        sunMesh.position.copy(COMPARE_SUN_POS);
        if (camera) sunMesh.lookAt(camera.position);
        else sunMesh.lookAt(0, 8, 0);
        return;
      }

      sunDir.copy(FLIGHT_SUN_DIR);
      if (camera) {
        sunMesh.position.copy(camera.position).addScaledVector(FLIGHT_SUN_DIR, 22000);
        sunMesh.lookAt(camera.position);
      } else {
        sunMesh.position.copy(FLIGHT_SUN_POS);
      }

      sun.position.copy(target).addScaledVector(FLIGHT_SUN_DIR, 420);
      sun.target.position.copy(target);
      sun.target.updateMatrixWorld();

      _toSun.copy(target).addScaledVector(FLIGHT_SUN_DIR, 40000);
      sun.intensity = rayHitsEarth(target, _toSun) ? 0.18 : 6.6;
    },
  };
}

function createSunStar(): THREE.Group {
  const g = new THREE.Group();
  g.name = "SunStar";

  const coreMat = new THREE.MeshBasicNodeMaterial();
  coreMat.colorNode = vec3(22, 19.5, 16.5);
  coreMat.depthTest = true;
  coreMat.depthWrite = true;
  coreMat.toneMapped = true;

  const core = new THREE.Mesh(new THREE.SphereGeometry(92, 24, 18), coreMat);
  core.name = "SunCore";
  core.renderOrder = 4;
  g.add(core);

  const glowMap = sunGlowMap();
  const corona = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: glowMap,
      color: 0xfff6e4,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  corona.name = "SunCorona";
  corona.scale.setScalar(560);
  corona.renderOrder = 5;
  g.add(corona);

  return g;
}

function sunGlowMap(): THREE.CanvasTexture {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,252,1)");
  g.addColorStop(0.045, "rgba(255,248,230,0.55)");
  g.addColorStop(0.12, "rgba(255,210,140,0.12)");
  g.addColorStop(0.28, "rgba(255,160,70,0.03)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function rayHitsEarth(from: THREE.Vector3, to: THREE.Vector3, radius = 13900): boolean {
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 1e-4) return false;
  dir.multiplyScalar(1 / len);
  const t = -from.dot(dir);
  if (t <= 0 || t >= len) return false;
  const closest = from.clone().addScaledVector(dir, t);
  return closest.lengthSq() < radius * radius;
}

export function createVolumetricSunShafts(_sunDir: THREE.Vector3): THREE.Group {
  const group = new THREE.Group();
  group.name = "SunShafts";

  const make = (len: number, r0: number, r1: number, opacity: number, color: number) => {
    const geo = new THREE.CylinderGeometry(r0, r1, len, 24, 1, true);
    geo.translate(0, -len / 2, 0);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 20;
    return mesh;
  };

  group.add(make(7000, 10, 48, 0.016, 0xffe4b0));
  group.add(make(4200, 22, 90, 0.008, 0xffd090));

  group.userData.align = (origin: THREE.Vector3, from: THREE.Vector3) => {
    group.position.copy(from);
    group.lookAt(origin);
    group.rotateX(Math.PI / 2);
  };

  return group;
}
