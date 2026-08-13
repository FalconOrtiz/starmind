import * as THREE from "three/webgpu";

export type PhysKind = "duck" | "tesla" | "human";

const GRAVITY = -9.81;
const MAX_SPEED = 12;
const PITCH_X = 51.5;
const PITCH_Z = 33.2;
const RESTITUTION = 0.18;
const GROUND_FRICTION = 0.86;

export interface PhysBody {
  kind: PhysKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  wx: number;
  wy: number;
  wz: number;
  halfX: number;
  halfY: number;
  halfZ: number;
  mass: number;
  awake: boolean;
  restX: number;
  restY: number;
  restZ: number;
  mesh: THREE.Object3D | null;
  instanceId: number;
  visualYOffset: number;
}

export class FieldPhysics {
  readonly bodies: PhysBody[] = [];
  instanced = new Map<PhysKind, THREE.InstancedMesh>();
  private readonly dummy = new THREE.Object3D();
  private readonly quat = new THREE.Quaternion();
  private readonly _from = new THREE.Vector3();
  private readonly _hit = new THREE.Vector3();
  private readonly _axis = new THREE.Vector3();
  private readonly _dq = new THREE.Quaternion();

  addMesh(
    kind: PhysKind,
    mesh: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    half: THREE.Vector3,
    mass: number,
    visualYOffset = 0
  ): PhysBody {
    const b = this.make(kind, x, y, z, half, mass, visualYOffset);
    b.mesh = mesh;
    mesh.position.set(x, y + visualYOffset, z);
    this.bodies.push(b);
    return b;
  }

  addInstance(
    kind: PhysKind,
    instanceId: number,
    x: number,
    y: number,
    z: number,
    half: THREE.Vector3,
    mass: number
  ): PhysBody {
    const b = this.make(kind, x, y, z, half, mass, 0);
    b.instanceId = instanceId;
    this.bodies.push(b);
    return b;
  }

  registerInstanced(kind: PhysKind, mesh: THREE.InstancedMesh): void {
    this.instanced.set(kind, mesh);
    this.writeInstances(kind);
  }

  reset(kind?: PhysKind): void {
    for (const b of this.bodies) {
      if (kind && b.kind !== kind) continue;
      b.x = b.restX;
      b.y = b.restY;
      b.z = b.restZ;
      b.vx = b.vy = b.vz = 0;
      b.wx = b.wy = b.wz = 0;
      b.qx = b.qz = b.qy = 0;
      b.qw = 1;
      b.awake = false;
    }
    this.syncVisuals(kind);
  }

  pokeRay(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    kind: PhysKind,
    radius: number,
    impulse: number
  ): number {
    dir.normalize();
    let hits = 0;
    const hitList: PhysBody[] = [];
    for (const b of this.bodies) {
      if (b.kind !== kind) continue;
      this._from.set(b.x, b.y, b.z).sub(origin);
      const t = this._from.dot(dir);
      if (t < 0 || t > 120) continue;
      this._hit.copy(origin).addScaledVector(dir, t);
      const dx = b.x - this._hit.x;
      const dy = b.y - this._hit.y;
      const dz = b.z - this._hit.z;
      const reach = Math.max(b.halfX, b.halfY, b.halfZ) + radius;
      if (dx * dx + dy * dy + dz * dz > reach * reach) continue;
      hitList.push(b);
    }

    const knockUp = THREE.MathUtils.clamp(impulse * 0.22, 0.55, 2.4);
    const knockSide = THREE.MathUtils.clamp(impulse * 0.48, 1.1, 5.2);

    for (const b of hitList) {
      const dx = b.x - this._hit.x;
      const dz = b.z - this._hit.z;
      b.vx += dir.x * knockSide + dx * 1.6 + (Math.random() - 0.5) * 0.8;
      b.vy += knockUp;
      b.vz += dir.z * knockSide + dz * 1.6 + (Math.random() - 0.5) * 0.8;
      b.wx += (Math.random() - 0.5) * 7;
      b.wy += (Math.random() - 0.5) * 5;
      b.wz += (Math.random() - 0.5) * 7;
      b.awake = true;
      hits++;
    }

    if (hitList.length) {
      this.wakeNeighbors(kind, hitList);
      this.wakeStack(kind, hitList);
    }
    return hits;
  }

  update(dt: number, kind: PhysKind | null): void {
    if (!kind) return;
    const step = Math.min(dt, 0.033);
    for (const b of this.bodies) {
      if (b.kind !== kind || !b.awake) continue;
      b.vy += GRAVITY * step;
      const speed = Math.hypot(b.vx, b.vy, b.vz);
      if (speed > MAX_SPEED) {
        const s = MAX_SPEED / speed;
        b.vx *= s;
        b.vy *= s;
        b.vz *= s;
      }
      b.x += b.vx * step;
      b.y += b.vy * step;
      b.z += b.vz * step;

      const floor = b.halfY;
      if (b.y < floor) {
        b.y = floor;
        if (b.vy < 0) b.vy *= -RESTITUTION;
        b.vx *= GROUND_FRICTION;
        b.vz *= GROUND_FRICTION;
        b.wx *= 0.72;
        b.wy *= 0.72;
        b.wz *= 0.72;
      }

      if (b.x > PITCH_X) {
        b.x = PITCH_X;
        b.vx *= -0.25;
      } else if (b.x < -PITCH_X) {
        b.x = -PITCH_X;
        b.vx *= -0.25;
      }
      if (b.z > PITCH_Z) {
        b.z = PITCH_Z;
        b.vz *= -0.25;
      } else if (b.z < -PITCH_Z) {
        b.z = -PITCH_Z;
        b.vz *= -0.25;
      }

      const spin = Math.hypot(b.wx, b.wy, b.wz);
      if (spin > 0.02) {
        this.quat.set(b.qx, b.qy, b.qz, b.qw);
        this._axis.set(b.wx, b.wy, b.wz);
        const ang = this._axis.length() * step;
        if (ang > 0) {
          this._axis.normalize();
          this._dq.setFromAxisAngle(this._axis, ang);
          this.quat.premultiply(this._dq).normalize();
          b.qx = this.quat.x;
          b.qy = this.quat.y;
          b.qz = this.quat.z;
          b.qw = this.quat.w;
        }
      }

      const still = Math.hypot(b.vx, b.vy, b.vz);
      if (still < 0.12 && b.y <= floor + 0.015 && spin < 0.15) {
        b.vx = b.vy = b.vz = 0;
        b.wx = b.wy = b.wz = 0;
        b.awake = false;
      }
    }

    this.resolveCollisions(kind);
    this.syncVisuals(kind);
  }

  private wakeStack(kind: PhysKind, seeds: PhysBody[]): void {
    for (const s of seeds) {
      for (const b of this.bodies) {
        if (b.kind !== kind || b.awake) continue;
        const sameCol = Math.abs(b.restX - s.restX) < 0.55 && Math.abs(b.restZ - s.restZ) < 0.55;
        if (!sameCol || b.restY < s.restY - 0.08) continue;
        b.awake = true;
        if (b === s) continue;
        const rise = (b.restY - s.restY) / Math.max(b.halfY * 2, 0.1);
        b.vx += (Math.random() - 0.5) * (1.6 + rise * 0.35);
        b.vz += (Math.random() - 0.5) * (1.6 + rise * 0.35);
        b.vy += 0.05;
        b.wx += (Math.random() - 0.5) * 3;
        b.wz += (Math.random() - 0.5) * 3;
      }
    }
  }

  private wakeNeighbors(kind: PhysKind, seeds: PhysBody[]): void {
    const reach = kind === "duck" ? 0.28 : kind === "human" ? 1.4 : 3.4;
    const r2 = reach * reach;
    for (const b of this.bodies) {
      if (b.kind !== kind || b.awake) continue;
      for (const s of seeds) {
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const dz = b.z - s.z;
        if (dx * dx + dy * dy + dz * dz > r2) continue;
        b.awake = true;
        if (b.y > s.y + 0.05) {
          b.vx += (Math.random() - 0.5) * 1.4;
          b.vz += (Math.random() - 0.5) * 1.4;
          b.vy += 0.15;
        }
        break;
      }
    }
  }

  private resolveCollisions(kind: PhysKind): void {
    const list = this.bodies.filter((b) => b.kind === kind && b.awake);
    const n = list.length;
    if (n < 2) return;
    const maxPairs = kind === "duck" ? 800 : 1200;
    let pairs = 0;
    for (let i = 0; i < n && pairs < maxPairs; i++) {
      const a = list[i];
      for (let j = i + 1; j < n && pairs < maxPairs; j++) {
        const b = list[j];
        const ox = a.halfX + b.halfX;
        const oy = a.halfY + b.halfY;
        const oz = a.halfZ + b.halfZ;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        if (Math.abs(dx) >= ox || Math.abs(dy) >= oy || Math.abs(dz) >= oz) continue;
        pairs++;
        const px = ox - Math.abs(dx);
        const py = oy - Math.abs(dy);
        const pz = oz - Math.abs(dz);
        if (px <= py && px <= pz) {
          const s = Math.sign(dx) || 1;
          const push = px * 0.51;
          a.x -= s * push;
          b.x += s * push;
          const rv = b.vx - a.vx;
          if (rv * s < 0) {
            a.vx += rv * 0.4;
            b.vx -= rv * 0.4;
          }
        } else if (py <= pz) {
          const s = Math.sign(dy) || 1;
          const push = py * 0.51;
          a.y -= s * push;
          b.y += s * push;
          const rv = b.vy - a.vy;
          if (rv * s < 0) {
            a.vy += rv * 0.35;
            b.vy -= rv * 0.35;
          }
        } else {
          const s = Math.sign(dz) || 1;
          const push = pz * 0.51;
          a.z -= s * push;
          b.z += s * push;
          const rv = b.vz - a.vz;
          if (rv * s < 0) {
            a.vz += rv * 0.4;
            b.vz -= rv * 0.4;
          }
        }
        a.awake = true;
        b.awake = true;
      }
    }
  }

  private make(
    kind: PhysKind,
    x: number,
    y: number,
    z: number,
    half: THREE.Vector3,
    mass: number,
    visualYOffset: number
  ): PhysBody {
    return {
      kind,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      qx: 0,
      qy: 0,
      qz: 0,
      qw: 1,
      wx: 0,
      wy: 0,
      wz: 0,
      halfX: half.x,
      halfY: half.y,
      halfZ: half.z,
      mass,
      awake: false,
      restX: x,
      restY: y,
      restZ: z,
      mesh: null,
      instanceId: -1,
      visualYOffset,
    };
  }

  private syncVisuals(kind?: PhysKind): void {
    for (const b of this.bodies) {
      if (kind && b.kind !== kind) continue;
      if (b.mesh) {
        b.mesh.position.set(b.x, b.y + b.visualYOffset, b.z);
        b.mesh.quaternion.set(b.qx, b.qy, b.qz, b.qw);
      }
    }
    if (!kind || kind === "duck") this.writeInstances("duck");
    if (!kind || kind === "human") this.writeInstances("human");
    if (!kind || kind === "tesla") this.writeInstances("tesla");
  }

  private writeInstances(kind: PhysKind): void {
    const mesh = this.instanced.get(kind);
    if (!mesh) return;
    for (const b of this.bodies) {
      if (b.kind !== kind || b.instanceId < 0) continue;
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.quaternion.set(b.qx, b.qy, b.qz, b.qw);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(b.instanceId, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
