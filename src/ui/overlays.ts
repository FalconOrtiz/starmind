import * as THREE from "three/webgpu";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { AI1 } from "../data/specs";
import type { ComparisonId } from "../data/comparisons";
import { COMPARISONS } from "../data/comparisons";

export function createLabelRenderer(container: HTMLElement): CSS2DRenderer {
  const r = new CSS2DRenderer({ element: container });
  r.setSize(window.innerWidth, window.innerHeight);
  return r;
}

function label(text: string): CSS2DObject {
  const el = document.createElement("div");
  el.className = "label3d";
  el.textContent = text;
  return new CSS2DObject(el);
}

export function createDimensionRig(): {
  group: THREE.Group;
  setComparison: (id: ComparisonId) => void;
  setVisible: (v: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = "Dimensions";

  const span = label(`Wingspan  ${AI1.wingspanM} m`);
  span.position.set(0, 22.4, 0);
  group.add(span);

  const height = label(`Height  ${AI1.deployedHeightM} m`);
  height.position.set(-8.2, 15, 3.4);
  group.add(height);

  const lineLbl = label("");
  lineLbl.name = "lineLabel";
  group.add(lineLbl);

  const stackLbl = label("");
  stackLbl.name = "stackLabel";
  group.add(stackLbl);

  const setComparison = (id: ComparisonId) => {
    const c = COMPARISONS[id];
    if (id === "pitch") {
      lineLbl.element.textContent = `${c.wingspanCount.toFixed(2)} PITCHES LONG`;
      lineLbl.position.set(0, 1.2, 36);
      stackLbl.element.textContent = "";
      stackLbl.position.set(0, 0, 0);
      return;
    }
    lineLbl.element.textContent = `${c.lineCount} ${noun(id)} LONG`;
    stackLbl.element.textContent = `${c.stackCount} ${noun(id)} TALL`;
    if (id === "tesla") {
      lineLbl.position.set(0, 2.4, 26);
      stackLbl.position.set(44, 16, -22);
    } else if (id === "human") {
      lineLbl.position.set(0, 2.2, 26);
      stackLbl.position.set(44, 16, -22);
    } else {
      lineLbl.position.set(0, 1.4, 20);
      stackLbl.position.set(42, 16, 18);
    }
  };

  setComparison("pitch");

  return {
    group,
    setComparison,
    setVisible: (v) => {
      group.visible = v;
    },
  };
}

function noun(id: ComparisonId): string {
  if (id === "tesla") return "CARS";
  if (id === "human") return "PEOPLE";
  if (id === "duck") return "DUCKS";
  return "";
}
