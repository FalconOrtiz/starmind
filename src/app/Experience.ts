import * as THREE from "three/webgpu";
import { AI1, PART_INFO, type PartId } from "../data/specs";
import type { ComparisonId } from "../data/comparisons";
import { createAI1 } from "../models/starmind/createAI1";
import { createEarth, startOrbitPosition } from "../scene/earth";
import { createLightRig, createVolumetricSunShafts, rayHitsEarth } from "../scene/lighting";
import { createPostFx, type PostFx } from "../scene/postfx";
import { createScalePark } from "../scene/scalePark";
import { FlightController } from "../camera/FlightController";
import { CompareController } from "../camera/CompareController";
import { mountHud, type AppMode } from "../ui/hud";
import { createDimensionRig, createLabelRenderer } from "../ui/overlays";

export class Experience {
  private renderer!: THREE.WebGPURenderer;
  private scene = new THREE.Scene();
  private flight!: FlightController;
  private compare!: CompareController;
  private post: PostFx | null = null;
  private mode: AppMode = "flight";
  private comparison: ComparisonId = "pitch";
  private readonly clock = new THREE.Clock();
  private readonly earthCenter = new THREE.Vector3();
  private lastFlightPos = startOrbitPosition();
  private lastFlightQuat = new THREE.Quaternion();
  private pointerMoved = 0;

  async start(): Promise<void> {
    const canvas = document.getElementById("c") as HTMLCanvasElement;
    const hudEl = document.getElementById("hud")!;
    const detailEl = document.getElementById("detail")!;
    const labelsEl = document.getElementById("labels")!;
    const loadingEl = document.getElementById("loading")!;

    let gpuMaxTex = 8192;
    try {
      this.renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: true,
        logarithmicDepthBuffer: true,
        requiredLimits: { maxTextureDimension2D: 16384 },
      });
      await this.renderer.init();
      gpuMaxTex = 16384;
    } catch {
      this.renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: true,
        logarithmicDepthBuffer: true,
      });
      await this.renderer.init();
      gpuMaxTex = 8192;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color(0x020308);

    this.flight = new FlightController(canvas);
    this.compare = new CompareController(this.flight.camera, canvas);

    const lights = createLightRig(this.scene);
    const earth = await createEarth(gpuMaxTex);
    this.scene.add(earth.group);

    const craft = createAI1();
    craft.group.position.copy(this.lastFlightPos);
    this.scene.add(craft.group);

    const wingmates: THREE.Group[] = [];
    for (let i = 0; i < 9; i++) {
      const extra = craft.group.clone(true);
      extra.name = `AI1_${i + 2}`;
      extra.visible = false;
      extra.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = false;
          m.receiveShadow = false;
        }
      });
      this.scene.add(extra);
      wingmates.push(extra);
    }
    let formation = 1;
    const FORMATION_GAP = 130;
    const _formRight = new THREE.Vector3();

    const shafts = createVolumetricSunShafts(lights.sunDir);
    this.scene.add(shafts);

    const park = createScalePark();
    park.group.visible = false;
    this.scene.add(park.group);

    const dims = createDimensionRig();
    dims.group.visible = false;
    this.scene.add(dims.group);

    const labels = createLabelRenderer(labelsEl);
    const hud = mountHud(hudEl, detailEl);

    try {
      this.post = createPostFx(this.renderer, this.scene, this.flight.camera, lights.sun);
    } catch (err) {
      console.warn("Post-processing unavailable, using direct render.", err);
      this.post = null;
    }

    try {
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.55;
    } catch {
      this.scene.environmentIntensity = 1;
    }

    lights.setFlight();
    lights.follow(craft.group.position, "flight", this.flight.camera);
    this.scene.environmentIntensity = 0.08;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    canvas.addEventListener("pointerdown", (e) => {
      this.pointerMoved = 0;
      if (this.mode !== "compare" || !park.activeKind()) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.flight.camera);
      park.poke(raycaster.ray.origin, raycaster.ray.direction, 7);
    });
    canvas.addEventListener("pointermove", (e) => {
      this.pointerMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
      if (this.mode !== "compare" || !park.activeKind()) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.flight.camera);
      park.poke(raycaster.ray.origin, raycaster.ray.direction, 1.8);
    });
    canvas.addEventListener("pointerup", (e) => {
      if (this.pointerMoved > 6) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.flight.camera);
      if (this.mode === "compare" && park.activeKind()) {
        park.poke(raycaster.ray.origin, raycaster.ray.direction, 9);
      }
      const hits = raycaster.intersectObject(craft.group, true);
      const id = hits[0]?.object.userData.partId as PartId | undefined;
      if (id && PART_INFO[id]) hud.showPart(PART_INFO[id]);
    });

    const craftEnvDefault = new Map<THREE.MeshPhysicalMaterial, number>();
    Object.values(craft.materials).forEach((m) => {
      if ("envMapIntensity" in m) craftEnvDefault.set(m, m.envMapIntensity);
    });
    const setCraftEnv = (flight: boolean) => {
      craftEnvDefault.forEach((def, m) => {
        m.envMapIntensity = flight ? Math.min(0.4, def * 0.22) : Math.min(0.5, def * 0.32);
      });
    };

    const applyMode = (mode: AppMode) => {
      this.mode = mode;
      hud.setMode(mode);
      if (mode === "flight") {
        park.group.visible = false;
        dims.group.visible = false;
        earth.group.visible = true;
        shafts.visible = true;
        craft.group.position.copy(this.lastFlightPos);
        craft.group.quaternion.copy(this.lastFlightQuat);
        this.flight.enabled = true;
        this.flight.snapNext();
        this.compare.disable();
        this.flight.camera.near = 0.15;
        this.flight.camera.far = 140000;
        this.flight.camera.updateProjectionMatrix();
        lights.setFlight();
        this.renderer.toneMappingExposure = 1.12;
        this.scene.background = new THREE.Color(0x020308);
        this.scene.environmentIntensity = 0.08;
        setCraftEnv(true);
      } else {
        this.lastFlightPos.copy(craft.group.position);
        this.lastFlightQuat.copy(craft.group.quaternion);
        earth.group.visible = false;
        wingmates.forEach((g) => {
          g.visible = false;
        });
        shafts.visible = true;
        park.group.visible = true;
        dims.group.visible = true;
        craft.group.position.set(0, 0, 0);
        craft.group.quaternion.identity();
        this.flight.enabled = false;
        this.flight.camera.up.set(0, 1, 0);
        this.flight.camera.near = 0.02;
        this.flight.camera.far = 800;
        this.flight.camera.updateProjectionMatrix();
        this.compare.enable();
        this.compare.frame(this.comparison);
        park.setComparison(this.comparison);
        dims.setComparison(this.comparison);
        hud.setComparison(this.comparison);
        hud.showComparison(this.comparison);
        lights.setCompare();
        lights.follow(new THREE.Vector3(0, 12, 0), "compare", this.flight.camera);
        this.renderer.toneMappingExposure = 0.86;
        this.scene.background = new THREE.Color(0x081018);
        this.scene.environmentIntensity = 0.22;
        setCraftEnv(false);
      }
    };

    hud.onMode(applyMode);
    hud.onComparison((id) => {
      this.comparison = id;
      park.setComparison(id);
      dims.setComparison(id);
      hud.setComparison(id);
      hud.showComparison(id);
      this.compare.frame(id);
    });
    const applyDrawingBuffer = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      const dpr = window.devicePixelRatio || 1;
      const pr = Math.min(dpr, 1.25, Math.sqrt((2560 * 1440) / (w * h)));
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(w, h, false);
      this.flight.camera.aspect = w / h;
      this.flight.camera.updateProjectionMatrix();
      this.post?.setSize(w, h);
      labels.setSize(w, h);
    };
    hud.onToggleLabels((on) => {
      dims.setVisible(on && this.mode === "compare");
    });
    let volumeOn = true;
    hud.onToggleVolume((on) => {
      volumeOn = on;
      shafts.visible = on && this.mode === "flight";
    });
    hud.onFormation((n) => {
      formation = n;
      hud.setFormation(n);
      if (this.mode === "flight") {
        const need = Math.min(1400, 90 + (n - 1) * 70);
        if (this.flight.distance < need) this.flight.distance = need;
      }
    });
    hud.setFormation(1);

    window.addEventListener("keydown", (e) => {
      if (e.code === "Digit1") applyMode("flight");
      if (e.code === "Digit2") applyMode("compare");
      if (this.mode === "flight" && (e.code === "Equal" || e.code === "NumpadAdd")) {
        formation = Math.min(10, formation + 1);
        hud.setFormation(formation);
      }
      if (this.mode === "flight" && (e.code === "Minus" || e.code === "NumpadSubtract")) {
        formation = Math.max(1, formation - 1);
        hud.setFormation(formation);
      }
    });

    window.addEventListener("resize", () => {
      applyDrawingBuffer();
    });

    applyDrawingBuffer();
    applyMode("flight");

    let fpsFrames = 0;
    let fpsLast = 0;

    const frame = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;

      if (this.mode === "flight") {
        this.flight.update(dt, craft.group, this.earthCenter);
        lights.follow(craft.group.position, "flight", this.flight.camera);
        const sunBlocked =
          rayHitsEarth(this.flight.camera.position, lights.sunMesh.position) ||
          rayHitsEarth(craft.group.position, lights.sunMesh.position);
        shafts.visible = volumeOn && !sunBlocked;
        if (shafts.visible) {
          (shafts.userData.align as ((o: THREE.Vector3, from: THREE.Vector3) => void) | undefined)?.(
            craft.group.position,
            lights.sunMesh.position
          );
        }
        earth.update(dt);
        craft.update(t, lights.sunDir);
        _formRight.copy(this.flight.right);
        if (_formRight.lengthSq() < 1e-6) _formRight.set(1, 0, 0);
        else _formRight.normalize();
        for (let i = 0; i < wingmates.length; i++) {
          const extra = wingmates[i];
          extra.visible = this.mode === "flight" && i < formation - 1;
          if (!extra.visible) continue;
          const rank = Math.floor(i / 2) + 1;
          const side = i % 2 === 0 ? 1 : -1;
          extra.position.copy(craft.group.position).addScaledVector(_formRight, side * rank * FORMATION_GAP);
          extra.quaternion.copy(craft.group.quaternion);
        }
        hud.setFlightReadout(
          this.flight.altitude(craft.group, this.earthCenter),
          this.flight.speed,
          this.flight.heading()
        );
      } else {
        this.compare.update();
        lights.follow(new THREE.Vector3(0, 12, 0), "compare", this.flight.camera);
        (shafts.userData.align as ((o: THREE.Vector3, from: THREE.Vector3) => void) | undefined)?.(
          new THREE.Vector3(0, 12, 0),
          lights.sunMesh.position
        );
        park.update(dt);
        craft.update(t, lights.sunDir);
      }

      if (this.post?.enabled && this.mode === "flight") this.post.render();
      else this.renderer.render(this.scene, this.flight.camera);
      labels.render(this.scene, this.flight.camera);
      fpsFrames += 1;
      if (t > 1.2 && t - fpsLast >= 0.5) {
        hud.setFps(Math.round(fpsFrames / (t - fpsLast)));
        fpsFrames = 0;
        fpsLast = t;
      }
    };

    this.renderer.setAnimationLoop(frame);
    loadingEl.classList.add("hide");
    setTimeout(() => loadingEl.remove(), 700);
    document.title = `${AI1.constellation} — ${AI1.name} Interactive`;
  }
}
