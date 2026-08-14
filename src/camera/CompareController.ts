import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ComparisonId } from "../data/comparisons";
import { isCoarsePointer, PinchZoom } from "../input/pinchZoom";

const DUCK_CLOSE = {
  pos: new THREE.Vector3(0.22, 0.11, 20.38),
  target: new THREE.Vector3(0.02, 0.055, 20.0),
};
const DUCK_FULL = {
  pos: new THREE.Vector3(28, 36, 78),
  target: new THREE.Vector3(12, 12, 14),
};

export class CompareController {
  readonly controls: OrbitControls;
  readonly camera: THREE.PerspectiveCamera;
  private id: ComparisonId = "pitch";
  private duckZoom = 0;
  private readonly pinch = new PinchZoom();
  private readonly dolly = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 0.05;
    this.controls.maxDistance = 280;
    this.controls.zoomSpeed = 1.8;
    this.controls.enabled = false;

    canvas.addEventListener("pointerdown", (e) => {
      if (!this.controls.enabled) return;
      const value = this.id === "duck" ? this.duckZoom : this.orbitDistance();
      this.pinch.down(e.pointerId, e.clientX, e.clientY, value);
      if (this.pinch.pinching) {
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
      }
    });
    const endPtr = (e: PointerEvent) => {
      this.pinch.up(e.pointerId);
      if (!this.pinch.pinching) {
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
      }
    };
    canvas.addEventListener("pointerup", endPtr);
    canvas.addEventListener("pointercancel", endPtr);
    canvas.addEventListener("pointermove", (e) => {
      if (!this.controls.enabled) return;
      if (this.id === "duck") {
        const next = this.pinch.moveLog(e.pointerId, e.clientX, e.clientY, 0.85);
        if (next === null) return;
        this.duckZoom = THREE.MathUtils.clamp(next, 0, 1);
        this.applyDuckZoom();
        return;
      }
      const next = this.pinch.move(e.pointerId, e.clientX, e.clientY);
      if (next === null) return;
      this.setOrbitDistance(next);
    });

    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.controls.enabled || this.id !== "duck") return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const step = e.deltaY > 0 ? 1 / 3 : -1 / 3;
        this.duckZoom = THREE.MathUtils.clamp(this.duckZoom + step, 0, 1);
        this.applyDuckZoom();
      },
      { capture: true, passive: false }
    );
  }

  isPinching(): boolean {
    return this.pinch.pinching;
  }

  /** dir > 0 zooms in (closer). */
  nudgeZoom(dir: number): void {
    if (this.id === "duck") {
      this.duckZoom = THREE.MathUtils.clamp(this.duckZoom + (dir > 0 ? -0.14 : 0.14), 0, 1);
      this.applyDuckZoom();
      return;
    }
    const factor = dir > 0 ? 0.72 : 1.38;
    this.setOrbitDistance(this.orbitDistance() * factor);
  }

  enable(): void {
    this.controls.enabled = true;
    this.frame("pitch");
  }

  disable(): void {
    this.controls.enabled = false;
    this.pinch.clear();
  }

  frame(id: ComparisonId): void {
    this.id = id;
    const mobile = isCoarsePointer();
    const frames: Record<Exclude<ComparisonId, "duck">, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
      pitch: mobile
        ? { pos: new THREE.Vector3(8, 58, 118), target: new THREE.Vector3(0, 10, 0) }
        : { pos: new THREE.Vector3(46, 40, 86), target: new THREE.Vector3(0, 10, 0) },
      tesla: mobile
        ? { pos: new THREE.Vector3(22, 32, 128), target: new THREE.Vector3(16, 12, 6) }
        : { pos: new THREE.Vector3(42, 34, 78), target: new THREE.Vector3(8, 10, 10) },
      human: mobile
        ? { pos: new THREE.Vector3(22, 32, 128), target: new THREE.Vector3(16, 12, 6) }
        : { pos: new THREE.Vector3(42, 34, 78), target: new THREE.Vector3(8, 10, 10) },
    };
    this.camera.fov = mobile ? 74 : 58;
    this.camera.updateProjectionMatrix();
    if (id === "duck") {
      this.duckZoom = mobile ? 0.22 : 0;
      this.controls.enableZoom = false;
      this.controls.minDistance = 0.05;
      this.controls.maxDistance = 220;
      this.camera.near = 0.02;
      this.camera.updateProjectionMatrix();
      this.applyDuckZoom();
      return;
    }
    this.controls.enableZoom = !mobile;
    this.controls.zoomSpeed = 1.8;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 320;
    this.camera.near = 0.2;
    this.camera.updateProjectionMatrix();
    const s = frames[id];
    this.camera.position.copy(s.pos);
    this.controls.target.copy(s.target);
    this.controls.update();
  }

  private orbitDistance(): number {
    return this.camera.position.distanceTo(this.controls.target);
  }

  private setOrbitDistance(dist: number): void {
    const next = THREE.MathUtils.clamp(dist, this.controls.minDistance, this.controls.maxDistance);
    this.dolly.copy(this.camera.position).sub(this.controls.target);
    if (this.dolly.lengthSq() < 1e-6) this.dolly.set(0, 0.2, 1);
    this.dolly.setLength(next);
    this.camera.position.copy(this.controls.target).add(this.dolly);
    this.controls.update();
  }

  private applyDuckZoom(): void {
    const t = this.duckZoom * this.duckZoom * (3 - 2 * this.duckZoom);
    this.camera.position.lerpVectors(DUCK_CLOSE.pos, DUCK_FULL.pos, t);
    this.controls.target.lerpVectors(DUCK_CLOSE.target, DUCK_FULL.target, t);
    this.controls.update();
  }

  update(): void {
    if (this.controls.enabled) this.controls.update();
  }
}
