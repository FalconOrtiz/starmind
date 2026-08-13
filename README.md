# STARMIND — AI1 Interactive

Cinematic Three.js **WebGPU** viewer of SpaceX’s AI1 satellite.

**Public demo:** [https://falconortiz.github.io/starmind/](https://falconortiz.github.io/starmind/)

Specs locked to [spacex.com/spacexai/starmind](https://www.spacex.com/spacexai/starmind):

- Deployed height **30 m / 98 ft**
- Wingspan **75 m / 246 ft**
- Compute **250 kW peak / 175 kW average**
- **75 kW / ton**

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5174

## Controls

**Flight**
- `WASD` fly the satellite
- `Q` / `E` altitude
- `Shift` boost
- Drag to look, scroll to dolly
- `+` / `−` formation (up to 10 satellites)
- Click a part for an English spec card

**Compare**
- Pick Football Pitch, Tesla Model 3, or Rubber Duck
- Orbit / zoom
- Real-size models and count overlays

`1` / `2` switch modes. Needs a browser with WebGPU (Chrome / Edge) or WebGL2 fallback.

Earth color maps are derived from NASA Blue Marble Next Generation.
