import "./styles.css";
import { Experience } from "./app/Experience";

const boot = new Experience();
boot.start().catch((err) => {
  console.error(err);
  const loading = document.getElementById("loading");
  if (loading) {
    loading.innerHTML = `<div class="loading-inner"><p class="loading-title">AI1</p><p class="loading-sub">Failed to start WebGPU viewer. Open the console.</p></div>`;
  }
});
