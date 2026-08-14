import * as THREE from "three/webgpu";
import {
  abs,
  cameraPosition,
  clamp,
  exp,
  float,
  max,
  min,
  mix,
  positionWorld,
  pow,
  smoothstep,
  texture,
  uniform,
  vec3,
} from "three/tsl";
import { FLIGHT_SUN_DIR } from "./lighting";

export function probeMaxTextureSize(): number {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return 8192;
    return gl.getParameter(gl.MAX_TEXTURE_SIZE) || 8192;
  } catch {
    return 8192;
  }
}

export const EARTH_RADIUS = 14000;
export const DEFAULT_ALTITUDE = 980;

/** Texture-aligned lat/lon → world (SphereGeometry + equirectangular, no mesh yaw). */
export function latLonToWorld(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const cl = Math.cos(lat);
  return new THREE.Vector3(cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)).multiplyScalar(radius);
}

export function startOrbitPosition(): THREE.Vector3 {
  return latLonToWorld(35, -6, EARTH_RADIUS + DEFAULT_ALTITUDE);
}

export interface EarthSystem {
  group: THREE.Group;
  earth: THREE.Mesh;
  clouds: THREE.Mesh;
  atmosphere: THREE.Mesh;
  stars: THREE.Points;
  update: (dt: number) => void;
}

function prepareColorMap(t: THREE.Texture): THREE.Texture {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

const TEXTURE_REMOTES = [
  "https://cdn.jsdelivr.net/gh/FalconOrtiz/starmind@main/public",
  "https://raw.githubusercontent.com/FalconOrtiz/starmind/main/public",
] as const;

function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}

function loadOnce(href: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      href,
      (t) => resolve(prepareColorMap(t)),
      undefined,
      () => resolve(null)
    );
  });
}

async function loadMap(url: string): Promise<THREE.Texture | null> {
  const local = await loadOnce(assetUrl(url));
  if (local) return local;
  if (!url.startsWith("/textures/")) return null;
  for (const root of TEXTURE_REMOTES) {
    const remote = await loadOnce(`${root}${url}`);
    if (remote) return remote;
  }
  return null;
}

function createGlobeMaterial(
  dayMap: THREE.Texture,
  nightMap: THREE.Texture | null,
  specMap: THREE.Texture | null,
  cloudMap: THREE.Texture | null,
  sunDir: THREE.Vector3
): THREE.Material {
  const sunU = uniform(sunDir);
  const dayTex = texture(dayMap);
  const nightTex = nightMap ? texture(nightMap) : vec3(0, 0, 0);
  const specTex = specMap ? texture(specMap) : vec3(0, 0, 0);
  const cloudTex = cloudMap ? texture(cloudMap) : vec3(0, 0, 0);

  const n = positionWorld.normalize();
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const ndl = n.dot(sunU);
  const dayF = smoothstep(float(-0.12), float(0.18), ndl);

  const albedo = dayTex.rgb.mul(1.07).pow(0.96);
  const cities = nightTex.rgb.mul(2.8).mul(float(1).sub(dayF).max(0));
  const nightFill = vec3(0.01, 0.014, 0.03).mul(float(1).sub(dayF));

  const halfV = sunU.add(viewDir).normalize();
  const spec = pow(max(n.dot(halfV), float(0)), 70).mul(specTex.r).mul(dayF);
  const waterDark = mix(float(1), float(0.82), specTex.r.mul(dayF));

  const airMass = pow(max(float(0), float(1).sub(abs(n.dot(viewDir)))), 2.35);
  const haze = vec3(0.32, 0.55, 1.0).mul(airMass).mul(0.1).mul(dayF.add(0.05));
  const sunHaze = vec3(1.0, 0.52, 0.2).mul(pow(max(viewDir.dot(sunU), 0), 5.5)).mul(airMass).mul(0.18);

  const dens = cloudTex.r;
  const alpha = pow(max(dens.sub(0.07), 0), 1.2).mul(0.7);

  const lit = albedo.mul(mix(float(0.04), float(1.08), dayF)).mul(waterDark);
  const ground = lit.add(cities).add(nightFill).add(spec.mul(vec3(1.15, 1.02, 0.82))).add(haze).add(sunHaze);

  const cloudCol = vec3(0.84, 0.87, 0.9).mul(dens.mul(0.28).add(0.72));
  const color = ground.mul(float(1).sub(alpha)).add(cloudCol.mul(alpha).mul(mix(float(0.28), float(1), dayF.add(0.12))));

  const mat = new THREE.MeshBasicNodeMaterial();
  mat.colorNode = color;
  return mat;
}

function createAtmosphereMaterial(sunDir: THREE.Vector3): THREE.Material {
  const sunU = uniform(sunDir);
  const planetR = float(EARTH_RADIUS);
  const scaleH = float(18);
  const atmH = float(EARTH_RADIUS * 0.016);

  const cam = cameraPosition;
  const rd = positionWorld.sub(cam).normalize();
  const b = cam.cross(rd).length();
  const hMin = b.sub(planetR);

  const dens = exp(clamp(hMin.negate().div(scaleH), -12, 4));
  const t = hMin.div(atmH);
  const limbGate = smoothstep(float(1.2), float(-0.06), t);
  const path = pow(max(float(0), float(1).sub(max(t, 0))), 0.55).mul(atmH).mul(2.05);
  const tau = dens.mul(path).mul(0.00052);
  const scatter = float(1).sub(exp(tau.negate())).mul(limbGate);

  const mu = rd.dot(sunU);
  const phaseR = float(0.75).mul(float(1).add(mu.mul(mu)));
  const sunAmt = smoothstep(float(-0.22), float(0.5), mu);
  const redAmt = pow(max(mu, 0), 7).add(pow(min(tau, 2.2), 1.25).mul(0.1));

  const rayleigh = vec3(0.16, 0.4, 1.0).mul(phaseR).mul(sunAmt.add(0.1));
  const mie = vec3(1.0, 0.52, 0.2).mul(redAmt);
  const col = rayleigh.add(mie).mul(scatter).mul(2.55);

  const mat = new THREE.MeshBasicNodeMaterial();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.BackSide;
  mat.blending = THREE.AdditiveBlending;
  mat.colorNode = col;
  return mat;
}

export async function createEarth(maxTextureSize = 8192): Promise<EarthSystem> {
  const group = new THREE.Group();
  group.name = "EarthSystem";

  const prefer16k = maxTextureSize >= 16384;
  const map =
    (prefer16k ? await loadMap("/textures/earth/earth_day_16k.jpg") : null) ??
    (await loadMap("/textures/earth/earth_day_8k.jpg")) ??
    (await loadMap("/textures/earth/earth_color_hi.jpg")) ??
    (await loadMap("/textures/earth/earth_color_4k.jpg"));
  if (!map) throw new Error("Earth color map failed to load");
  const img = map.image as { width?: number; height?: number };
  console.info(`[earth] day map ${img.width ?? "?"}x${img.height ?? "?"} (gpu max ${maxTextureSize})`);

  const nightMap =
    (await loadMap("/textures/earth/earth_night_8k.jpg")) ?? (await loadMap("/textures/earth/earth_night.jpg"));
  const specRaw =
    (await loadMap("/textures/earth/earth_spec_8k.jpg")) ?? (await loadMap("/textures/earth/earth_spec.jpg"));
  if (specRaw) specRaw.colorSpace = THREE.NoColorSpace;

  const cloudMap =
    (await loadMap("/textures/earth/earth_clouds_8k.jpg")) ?? (await loadMap("/textures/earth/earth_clouds.png"));
  if (cloudMap) cloudMap.colorSpace = THREE.NoColorSpace;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 384, 256),
    createGlobeMaterial(map, nightMap, specRaw, cloudMap, FLIGHT_SUN_DIR)
  );
  earth.name = "Earth";
  earth.receiveShadow = false;
  earth.castShadow = false;
  group.add(earth);

  const clouds = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }));
  clouds.name = "Clouds";
  clouds.visible = false;

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.016, 192, 128),
    createAtmosphereMaterial(FLIGHT_SUN_DIR)
  );
  atmosphere.name = "Atmosphere";
  atmosphere.renderOrder = 2;
  group.add(atmosphere);

  const stars = createStars();
  group.add(stars);

  return {
    group,
    earth,
    clouds,
    atmosphere,
    stars,
    update: (dt) => {
      earth.rotation.y += dt * 0.0042;
    },
  };
}

function createStars(): THREE.Points {
  const count = 14000;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 78000 + Math.random() * 40000;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const temp = Math.random();
    const bright = 0.55 + Math.random() * 0.45;
    if (temp < 0.15) {
      col[i * 3] = 0.7 * bright;
      col[i * 3 + 1] = 0.82 * bright;
      col[i * 3 + 2] = 1.0 * bright;
    } else if (temp > 0.88) {
      col[i * 3] = 1.0 * bright;
      col[i * 3 + 1] = 0.82 * bright;
      col[i * 3 + 2] = 0.62 * bright;
    } else {
      col[i * 3] = bright;
      col[i * 3 + 1] = bright;
      col[i * 3 + 2] = bright * 0.98;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 11,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
