import * as THREE from "three/webgpu";
import { EARTH_RADIUS } from "../scene/earth";
import { PinchZoom } from "../input/pinchZoom";

export class FlightController {
  readonly camera: THREE.PerspectiveCamera;
  enabled = true;
  yaw = 0.62;
  pitch = -0.18;
  distance = 78;
  private readonly keys = new Set<string>();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private readonly vel = new THREE.Vector3();
  readonly look = new THREE.Vector3();
  readonly right = new THREE.Vector3();
  readonly up = new THREE.Vector3();
  private readonly fwd = new THREE.Vector3();
  private readonly desired = new THREE.Vector3();
  private readonly camPos = new THREE.Vector3();
  private primed = false;
  speed = 0;
  private readonly pinch = new PinchZoom();

  snapNext(): void {
    this.primed = false;
  }

  isPinching(): boolean {
    return this.pinch.pinching;
  }

  /** dir > 0 zooms in (closer). */
  nudgeZoom(dir: number): void {
    this.distance = THREE.MathUtils.clamp(this.distance * (dir > 0 ? 0.7 : 1.42), 18, 1600);
  }

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.15, 140000);
    window.addEventListener("keydown", (e) => this.keys.add(e.code));
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled) return;
      this.pinch.down(e.pointerId, e.clientX, e.clientY, this.distance);
      if (this.pinch.pinching) {
        this.dragging = false;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* already free */
        }
        return;
      }
      if (e.button !== 0) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      if (e.pointerType !== "touch") canvas.setPointerCapture(e.pointerId);
    });
    const endPtr = (e: PointerEvent) => {
      this.pinch.up(e.pointerId);
      if (this.pinch.pointers.size === 0) this.dragging = false;
    };
    canvas.addEventListener("pointerup", endPtr);
    canvas.addEventListener("pointercancel", endPtr);
    canvas.addEventListener("pointermove", (e) => {
      if (!this.enabled) return;
      const next = this.pinch.move(e.pointerId, e.clientX, e.clientY);
      if (next !== null) {
        this.distance = THREE.MathUtils.clamp(next, 18, 1600);
        this.dragging = false;
        return;
      }
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.yaw -= dx * 0.0045;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0035, -1.38, 1.12);
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.08, 18, 1600);
      },
      { passive: false }
    );
  }

  update(dt: number, satellite: THREE.Object3D, earthCenter: THREE.Vector3): void {
    this.up.copy(satellite.position).sub(earthCenter).normalize();
    this.fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const east = new THREE.Vector3().crossVectors(this.up, new THREE.Vector3(0, 1, 0));
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0);
    east.normalize();
    const north = new THREE.Vector3().crossVectors(east, this.up).normalize();
    this.look.copy(north).multiplyScalar(this.fwd.z).addScaledVector(east, -this.fwd.x);
    this.look.addScaledVector(this.up, this.pitch);
    this.look.normalize();
    this.right.crossVectors(this.look, this.up).normalize();

    const boost = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 3.4 : 1;
    const accel = 38 * boost;
    const wish = new THREE.Vector3();
    if (this.keys.has("KeyW")) wish.add(this.look);
    if (this.keys.has("KeyS")) wish.sub(this.look);
    if (this.keys.has("KeyD")) wish.add(this.right);
    if (this.keys.has("KeyA")) wish.sub(this.right);
    if (this.keys.has("KeyE")) wish.add(this.up);
    if (this.keys.has("KeyQ")) wish.sub(this.up);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(accel);
    if (this.keys.has("Space")) this.vel.multiplyScalar(Math.max(0, 1 - dt * 6));

    this.vel.addScaledVector(wish, dt);
    this.vel.multiplyScalar(Math.exp(-dt * 1.6));
    this.speed = this.vel.length();
    satellite.position.addScaledVector(this.vel, dt);

    const radial = satellite.position.clone().sub(earthCenter);
    const alt = radial.length() - EARTH_RADIUS;
    const minAlt = 55;
    const maxAlt = 2400;
    if (alt < minAlt) {
      radial.setLength(EARTH_RADIUS + minAlt);
      satellite.position.copy(earthCenter).add(radial);
      const vr = this.vel.dot(this.up);
      if (vr < 0) this.vel.addScaledVector(this.up, -vr);
    } else if (alt > maxAlt) {
      radial.setLength(EARTH_RADIUS + maxAlt);
      satellite.position.copy(earthCenter).add(radial);
    }

    const face = this.look.clone().projectOnPlane(this.up);
    if (face.lengthSq() > 1e-6) {
      face.normalize();
      const m = new THREE.Matrix4();
      m.lookAt(new THREE.Vector3(), face, this.up);
      satellite.quaternion.setFromRotationMatrix(m);
    }

    this.desired.copy(satellite.position).addScaledVector(this.look, -this.distance).addScaledVector(this.up, this.distance * 0.18);
    if (!this.primed) {
      this.camPos.copy(this.desired);
      this.primed = true;
    } else {
      this.camPos.lerp(this.desired, 1 - Math.exp(-dt * 8));
    }
    this.camera.up.copy(this.up);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(satellite.position);
  }

  altitude(satellite: THREE.Object3D, earthCenter: THREE.Vector3): number {
    return satellite.position.distanceTo(earthCenter) - EARTH_RADIUS;
  }

  heading(): number {
    let deg = THREE.MathUtils.radToDeg(-this.yaw);
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }
}
