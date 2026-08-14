# STARMIND — agent contract

This repository is a **finished** interactive viewer. Clone it, install it, run it, publish it.

Do **not** scaffold a new app. Do **not** rewrite the satellite, Earth, compare park, HUD, lighting, or physics. Do **not** ask the user for product direction — the app is specified below.

## Boot (required)

Node.js 20 or newer.

```bash
git clone https://github.com/FalconOrtiz/starmind.git
cd starmind
npm ci
npm run dev
```

Dev server: **http://localhost:5174**

```bash
npm run build    # static files in dist/
npm run preview  # serve dist/
```

No env files. No backend. No API keys.

## Product

Unofficial cinematic **Three.js WebGPU** viewer of SpaceX **AI1 / STARMIND**. English UI only. WebGL2 fallback via Three’s WebGPURenderer.

Locked specs live in `src/data/specs.ts` (do not change numbers):

- Height **30 m / 98 ft**
- Wingspan **75 m / 246 ft**
- Compute **250 kW peak / 175 kW average**
- **75 kW / ton**
- Source: https://www.spacex.com/spacexai/starmind

### Flight (`1`)

- `WASD` fly · `Q`/`E` altitude · `Shift` boost · drag look · scroll dolly
- `+` / `−` formation (1–10 satellites)
- Click a part for an English spec card

### Compare (`2`)

Real-size overlays on a FIFA pitch. Definitions in `src/data/comparisons.ts`:

| Mode | Counts |
| --- | --- |
| Football Pitch | 0.71 wingspan · 0.29 height |
| Tesla Model 3 | 16 cars long · 21 tall |
| Humans | 150 long · 17 tall |
| Rubber Duck | 882 long · 400 tall |

Hover/click compare objects to shove them (Rapier-free custom physics in `src/physics/fieldPhysics.ts`).

## Layout

```
src/app/Experience.ts          boot, modes, render loop
src/models/starmind/           AI1 mesh + materials
src/models/compare/            pitch, Tesla, humans, ducks
src/scene/earth.ts             Earth + NASA maps
src/scene/lighting.ts          sun rig + volumetric shafts
src/scene/scalePark.ts         compare arena
src/camera/                    FlightController, CompareController
src/ui/                        HUD + 3D labels
src/data/                      locked specs + compare math
public/textures/earth/         required color / night / spec / cloud maps
```

## Assets (must ship)

Every map `src/scene/earth.ts` loads must be present under `public/textures/earth/`:

- `earth_day_16k.jpg` (used when GPU max tex ≥ 16k)
- `earth_day_8k.jpg`, `earth_color_hi.jpg`, `earth_color_4k.jpg` (fallbacks)
- `earth_night_8k.jpg`, `earth_night.jpg`
- `earth_spec_8k.jpg`, `earth_spec.jpg`
- `earth_clouds_8k.jpg`, `earth_clouds.png`

If a sandbox cannot copy the binaries, keep the paths — `earth.ts` falls back to jsDelivr / GitHub raw of this repo. Do **not** replace Earth with an untextured sphere.

Unused maps listed in `.gitignore` stay unused.

## Publish (grok.me / any static host)

This is a static Vite SPA. After `npm run build`, host the `dist/` folder. GitHub Pages uses `BASE_PATH=/starmind/` (see `.github/workflows/pages.yml`).

For Grok Build Mode / grok.me:

1. Import **this repo as-is** (all of `src/`, `public/`, `package.json`, `vite.config.ts`).
2. `npm ci` then run or build. Do not regenerate files.
3. Publish the running preview.

## Do not

- Recreate AI1 as a flat box or stock satellite
- Translate the UI
- Add auth, a CMS, or a server
- “Improve” by starting over
- Treat the current look as a blank to redesign unless the user asks

## Visual state (accepted)

- Textured Earth (Blue Marble family), atmosphere, stars
- AI1 as a two-wing orbital compute craft with clickable parts
- Volumetric sun shaft may bloom on a wing — that is current lighting, not a missing feature
- Compare park includes pitch, Tesla line + stack, humans, and 882 ducks
