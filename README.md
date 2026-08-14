# STARMIND — AI1 Interactive

Unofficial cinematic **Three.js / WebGPU** viewer of SpaceX’s AI1 satellite.

Live (GitHub Pages, after deploy): https://falconortiz.github.io/starmind/

Not affiliated with SpaceX. Specs follow the public [Starmind](https://www.spacex.com/spacexai/starmind) page. Earth color maps are derived from NASA Blue Marble Next Generation.

## Paste this into Grok Build or grok.com Build Mode

```
Clone https://github.com/FalconOrtiz/starmind as-is. It is a finished Vite + Three.js WebGPU app.

cd starmind
npm ci
npm run dev

Do not scaffold a new project. Do not rewrite the satellite, Earth, compare park, HUD, or lighting. Copy every file, including public/textures/earth.

When it runs, publish the preview to grok.me (or host dist/ after npm run build). Read AGENTS.md and follow it.
```

## Run locally

Needs **Node.js 20+** and a browser with WebGPU (Chrome / Edge) or WebGL2.

```bash
git clone https://github.com/FalconOrtiz/starmind.git
cd starmind
npm ci
npm run dev
```

Opens http://localhost:5174

```bash
npm run build
npm run preview
```

## Controls

**Flight** (`1`)

- `WASD` fly · `Q` / `E` altitude · `Shift` boost
- Drag to look · scroll to dolly
- `+` / `−` formation (up to 10)
- Click a part for an English spec card

**Compare** (`2`)

Football Pitch · Tesla Model 3 · Humans · Rubber Duck. Orbit / zoom. Hover or click objects to shove them.

## Specs (locked)

| | |
| --- | --- |
| Height | 30 m / 98 ft |
| Wingspan | 75 m / 246 ft |
| Compute | 250 kW peak · 175 kW average |
| Efficiency | 75 kW / ton |

## For Grok / grok.me

This repo is the full product. Instructions for agents are in [`AGENTS.md`](./AGENTS.md). There is nothing else to invent.

## License

Code is MIT (see `LICENSE`). SpaceX, Starlink, StarMind, and AI1 names and imagery are trademarks of their owners.
