import * as THREE from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

export interface PostFx {
  enabled: boolean;
  render: () => void;
  setSize: (w: number, h: number) => void;
}

export function createPostFx(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  _sun: THREE.DirectionalLight
): PostFx {
  const pipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode("output");
  const bloomPass = bloom(color, 0.28, 0.32, 0.78);
  pipeline.outputNode = color.add(bloomPass);

  return {
    enabled: true,
    render: () => {
      pipeline.render();
    },
    setSize: (w, h) => {
      renderer.setSize(w, h);
    },
  };
}
