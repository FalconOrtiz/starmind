import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ComparisonId } from "../data/comparisons";

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

  enable(): void {
    this.controls.enabled = true;
    this.frame("pitch");
  }

  disable(): void {
    this.controls.enabled = false;
  }

  frame(id: ComparisonId): void {
    this.id = id;
    const shots: Record<Exclude<ComparisonId, "duck">, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
      pitch: { pos: new THREE.Vector3(46, 40, 86), target: new THREE.Vector3(0, 10, 0) },
      tesla: { pos: new THREE.Vector3(42, 34, 78), target: new THREE.Vector3(8, 10, 10) },
      human: { pos: new THREE.Vector3(42, 34, 78), target: new THREE.Vector3(8, 10, 10) },
    };
    if (id === "duck") {
      this.duckZoom = 0;
      this.controls.enableZoom = false;
      this.controls.minDistance = 0.05;
      this.controls.maxDistance = 220;
      this.camera.near = 0.02;
      this.camera.updateProjectionMatrix();
      this.applyDuckZoom();
      return;
    }
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.8;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 280;
    this.camera.near = 0.2;
    this.camera.updateProjectionMatrix();
    const s = shots[id];
    this.camera.position.copy(s.pos);
    this.controls.target.copy(s.target);
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
