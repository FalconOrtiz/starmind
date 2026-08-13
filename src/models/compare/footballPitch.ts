import * as THREE from "three/webgpu";
import { grassTexture, pitchLinesTexture } from "../starmind/textures";

export function createFootballPitch(): THREE.Group {
  const g = new THREE.Group();
  g.name = "FootballPitch";

  const grassMap = new THREE.CanvasTexture(grassTexture());
  grassMap.colorSpace = THREE.SRGBColorSpace;
  grassMap.anisotropy = 8;

  const lineMap = new THREE.CanvasTexture(pitchLinesTexture());
  lineMap.colorSpace = THREE.SRGBColorSpace;
  lineMap.anisotropy = 8;

  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(105, 68),
    new THREE.MeshStandardMaterial({
      map: grassMap,
      roughness: 0.92,
      metalness: 0,
    })
  );
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  g.add(field);

  const lines = new THREE.Mesh(
    new THREE.PlaneGeometry(105, 68),
    new THREE.MeshStandardMaterial({
      map: lineMap,
      transparent: true,
      roughness: 0.55,
      metalness: 0,
      depthWrite: false,
    })
  );
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = 0.02;
  g.add(lines);

  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(125, 84),
    new THREE.MeshStandardMaterial({ color: 0x2a5a24, roughness: 1 })
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.02;
  apron.receiveShadow = true;
  g.add(apron);

  for (const x of [-52.5, 52.5]) {
    const goal = createGoal();
    goal.position.set(x, 0, 0);
    if (x > 0) goal.rotation.y = Math.PI;
    g.add(goal);
  }

  return g;
}

function hexNetTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(236,236,236,0.92)";
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";

  const r = 15;
  const h = r * Math.sqrt(3);
  const colW = r * 1.5;
  for (let row = -1; row < size / h + 2; row++) {
    for (let col = -1; col < size / colW + 2; col++) {
      const cx = col * colW;
      const cy = row * h + (col & 1 ? h * 0.5 : 0);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function tube(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  radius: number,
  mat: THREE.Material
): THREE.Mesh {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len = Math.hypot(dx, dy, dz) || 0.001;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 14), mat);
  mesh.position.set((ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
  return mesh;
}

function netQuad(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  mat: THREE.Material,
  uRepeat: number,
  vRepeat: number
): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z]),
      3
    )
  );
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, vRepeat, uRepeat, vRepeat, uRepeat, 0, 0, 0]), 2));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function createGoal(): THREE.Group {
  const g = new THREE.Group();
  g.name = "FIFAGoal";

  const postMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6f6f4,
    metalness: 0.18,
    roughness: 0.26,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
  });
  const jointMat = new THREE.MeshPhysicalMaterial({
    color: 0xefefed,
    metalness: 0.22,
    roughness: 0.3,
    clearcoat: 0.3,
  });
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d4,
    roughness: 0.45,
    metalness: 0.2,
  });

  const netMap = hexNetTexture();
  netMap.repeat.set(1, 1);
  const netMat = new THREE.MeshStandardMaterial({
    map: netMap,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.72,
    metalness: 0,
    alphaTest: 0.08,
  });

  const postR = 0.06;
  const innerW = 7.32;
  const height = 2.44;
  const hz = innerW / 2 + postR;
  const topDepth = 1.55;
  const groundDepth = 2.2;
  const thin = postR * 0.78;

  for (const z of [-hz, hz]) {
    g.add(tube(0, 0, z, 0, height, z, postR, postMat));
    g.add(tube(0, height, z, -topDepth, height, z, thin, postMat));
    g.add(tube(-topDepth, height, z, -groundDepth, 0.04, z, thin, postMat));
    g.add(tube(0, postR, z, -groundDepth, postR, z, thin * 0.92, postMat));

    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(postR * 1.18, 16, 12), jointMat);
    knuckle.position.set(0, height, z);
    g.add(knuckle);

    const rearKnuckle = new THREE.Mesh(new THREE.SphereGeometry(thin * 1.15, 12, 10), jointMat);
    rearKnuckle.position.set(-topDepth, height, z);
    g.add(rearKnuckle);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(postR * 1.55, postR * 1.7, 0.07, 16), socketMat);
    socket.position.set(0, 0.035, z);
    g.add(socket);

    const rearSocket = new THREE.Mesh(new THREE.CylinderGeometry(thin * 1.4, thin * 1.55, 0.05, 12), socketMat);
    rearSocket.position.set(-groundDepth, 0.025, z);
    g.add(rearSocket);
  }

  g.add(tube(0, height, -hz, 0, height, hz, postR, postMat));
  g.add(tube(-topDepth, height, -hz, -topDepth, height, hz, thin, postMat));
  g.add(tube(-groundDepth, postR, -hz, -groundDepth, postR, hz, thin * 0.92, postMat));

  const inset = 0.03;
  const fl = new THREE.Vector3(-inset, 0.04, -hz + inset);
  const fr = new THREE.Vector3(-inset, 0.04, hz - inset);
  const tl = new THREE.Vector3(-inset, height - 0.02, -hz + inset);
  const tr = new THREE.Vector3(-inset, height - 0.02, hz - inset);
  const rtl = new THREE.Vector3(-topDepth + 0.02, height - 0.02, -hz + inset);
  const rtr = new THREE.Vector3(-topDepth + 0.02, height - 0.02, hz - inset);
  const rbl = new THREE.Vector3(-groundDepth + 0.03, 0.05, -hz + inset);
  const rbr = new THREE.Vector3(-groundDepth + 0.03, 0.05, hz - inset);

  const topNet = netQuad(tl, tr, rtr, rtl, netMat, 7.2, 1.6);
  const backNet = netQuad(rtl, rtr, rbr, rbl, netMat.clone(), 7.2, 2.6);
  const leftNet = netQuad(fl, tl, rtl, rbl, netMat.clone(), 2.2, 2.6);
  const rightNet = netQuad(fr, rbr, rtr, tr, netMat.clone(), 2.2, 2.6);

  g.add(topNet, backNet, leftNet, rightNet);

  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return g;
}
