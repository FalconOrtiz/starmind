import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  server: {
    port: 5174,
    open: true,
  },
  build: {
    target: "esnext",
  },
});
