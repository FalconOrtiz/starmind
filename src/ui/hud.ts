import { AI1, type PartInfo } from "../data/specs";
import { COMPARISON_ORDER, COMPARISONS, type ComparisonId } from "../data/comparisons";

export type AppMode = "flight" | "compare";

export interface HudApi {
  setMode: (mode: AppMode) => void;
  setComparison: (id: ComparisonId) => void;
  setFlightReadout: (altM: number, speed: number, heading: number) => void;
  setFps: (fps: number) => void;
  setFormation: (n: number) => void;
  showPart: (info: PartInfo) => void;
  showComparison: (id: ComparisonId) => void;
  hideDetail: () => void;
  onMode: (cb: (mode: AppMode) => void) => void;
  onComparison: (cb: (id: ComparisonId) => void) => void;
  onFormation: (cb: (n: number) => void) => void;
  onZoom: (cb: (dir: number) => void) => void;
}

export function mountHud(root: HTMLElement, detail: HTMLElement): HudApi {
  root.innerHTML = `
    <div class="brand glass">
      <div class="kicker">${AI1.constellation}</div>
      <h1>${AI1.name}</h1>
      <p>${AI1.tagline} Localized compute in sun-synchronous orbit, laser-linked through Starlink.</p>
      <div class="stats">
        <div><span>Height</span><strong>${AI1.deployedHeightM} m / ${AI1.deployedHeightFt} ft</strong></div>
        <div><span>Wingspan</span><strong>${AI1.wingspanM} m / ${AI1.wingspanFt} ft</strong></div>
        <div><span>Compute</span><strong>${AI1.computePeakKw} kW peak</strong></div>
        <div><span>Average</span><strong>${AI1.computeAvgKw} kW</strong></div>
      </div>
    </div>

    <div class="hud-top glass" id="mode-switch">
      <button data-mode="flight" class="active">Flight</button>
      <button data-mode="compare">Compare</button>
    </div>

    <div class="glass formation-panel" id="formation-panel">
      <div class="section">Satellites</div>
      <div class="stepper">
        <button id="btn-sat-minus" type="button" aria-label="Remove satellite">−</button>
        <span id="sat-count">1 / 10</span>
        <button id="btn-sat-plus" type="button" aria-label="Add satellite">+</button>
      </div>
    </div>

    <div class="flight-readout glass" id="flight-readout">
      <div class="row"><span>ALTITUDE</span><b id="rd-alt">—</b></div>
      <div class="row"><span>SPEED</span><b id="rd-spd">—</b></div>
      <div class="row"><span>HEADING</span><b id="rd-hdg">—</b></div>
      <div class="row"><span>ORBIT</span><b>SSO · near-space</b></div>
    </div>
    <div class="fps-badge glass" id="fps-badge"><span>FPS</span><b id="rd-fps">—</b></div>

    <div class="compare-dock glass" id="compare-dock" style="display:none">
      ${COMPARISON_ORDER.map(
        (id) => `<button data-cmp="${id}"${id === "pitch" ? ' class="active"' : ""}>${COMPARISONS[id].title}</button>`
      ).join("")}
    </div>

    <div class="zoom-pad glass" id="zoom-pad">
      <div class="section">Zoom</div>
      <button id="btn-zoom-in" type="button" aria-label="Zoom in">+</button>
      <button id="btn-zoom-out" type="button" aria-label="Zoom out">−</button>
    </div>

    <div class="hint glass" id="hint">
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly
      · <kbd>Q</kbd><kbd>E</kbd> altitude
      · <kbd>Shift</kbd> boost
      · drag to look
      · click a part
    </div>
  `;

  let modeCb: ((m: AppMode) => void) | null = null;
  let cmpCb: ((id: ComparisonId) => void) | null = null;
  let formCb: ((n: number) => void) | null = null;
  let zoomCb: ((dir: number) => void) | null = null;
  let satCount = 1;

  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.mode) {
      modeCb?.(t.dataset.mode as AppMode);
    }
    if (t.dataset.cmp) {
      cmpCb?.(t.dataset.cmp as ComparisonId);
    }
    if (t.id === "btn-sat-plus") {
      satCount = Math.min(10, satCount + 1);
      formCb?.(satCount);
    }
    if (t.id === "btn-sat-minus") {
      satCount = Math.max(1, satCount - 1);
      formCb?.(satCount);
    }
    if (t.id === "btn-zoom-in") zoomCb?.(1);
    if (t.id === "btn-zoom-out") zoomCb?.(-1);
  });

  const formPanel = root.querySelector("#formation-panel") as HTMLElement;
  const satCountEl = root.querySelector("#sat-count") as HTMLElement;
  const flightEl = root.querySelector("#flight-readout") as HTMLElement;
  const compareEl = root.querySelector("#compare-dock") as HTMLElement;
  const hint = root.querySelector("#hint") as HTMLElement;
  const alt = root.querySelector("#rd-alt") as HTMLElement;
  const spd = root.querySelector("#rd-spd") as HTMLElement;
  const hdg = root.querySelector("#rd-hdg") as HTMLElement;
  const fpsEl = root.querySelector("#rd-fps") as HTMLElement;

  const paintDetail = (kicker: string, title: string, body: string, takeaway: string | null, stats: { label: string; value: string }[]) => {
    detail.classList.remove("hidden");
    detail.innerHTML = `
      <button class="close" type="button" aria-label="Close">×</button>
      <div class="kicker">${kicker}</div>
      <h2>${title}</h2>
      <p>${body}</p>
      ${takeaway ? `<p class="takeaway">${takeaway}</p>` : ""}
      <div class="mini-stats">
        ${stats.map((s) => `<div><span>${s.label}</span><strong>${s.value}</strong></div>`).join("")}
      </div>
    `;
    detail.querySelector(".close")?.addEventListener("click", () => {
      detail.classList.add("hidden");
    });
  };

  return {
    setMode: (mode) => {
      root.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", (b as HTMLElement).dataset.mode === mode));
      flightEl.style.display = mode === "flight" ? "block" : "none";
      formPanel.style.display = mode === "flight" ? "block" : "none";
      compareEl.style.display = mode === "compare" ? "flex" : "none";
      hint.innerHTML =
        mode === "flight"
          ? `<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · pinch or <kbd>+</kbd><kbd>−</kbd> zoom · drag to look`
          : `Pinch or <kbd>+</kbd><kbd>−</kbd> zoom · drag to orbit · tap to shove`;
    },
    setComparison: (id) => {
      root.querySelectorAll("[data-cmp]").forEach((b) => b.classList.toggle("active", (b as HTMLElement).dataset.cmp === id));
    },
    setFormation: (n) => {
      satCount = n;
      satCountEl.textContent = `${n} / 10`;
    },
    setFps: (fps) => {
      fpsEl.textContent = `${fps}`;
    },
    setFlightReadout: (altM, speed, heading) => {
      const km = altM / 1000;
      alt.textContent = km >= 1 ? `${km.toFixed(2)} km` : `${altM.toFixed(0)} m`;
      spd.textContent = `${speed.toFixed(1)} m/s`;
      hdg.textContent = `${heading.toFixed(0)}°`;
    },
    showPart: (info) => paintDetail(info.kicker, info.title, info.body, null, info.stats),
    showComparison: (id) => {
      const c = COMPARISONS[id];
      paintDetail(c.kicker, c.title, c.body, c.takeaway, c.stats);
    },
    hideDetail: () => detail.classList.add("hidden"),
    onMode: (cb) => {
      modeCb = cb;
    },
    onComparison: (cb) => {
      cmpCb = cb;
    },
    onFormation: (cb) => {
      formCb = cb;
    },
    onZoom: (cb) => {
      zoomCb = cb;
    },
  };
}
