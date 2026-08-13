export const AI1 = {
  name: "AI1",
  constellation: "STARMIND",
  tagline: "Orbital compute. Always sunny.",
  deployedHeightM: 30,
  deployedHeightFt: 98,
  wingspanM: 75,
  wingspanFt: 246,
  computePeakKw: 250,
  computeAvgKw: 175,
  efficiencyKwPerTon: 75,
  orbit: "Sun-synchronous low Earth orbit",
  altitudeKmDefault: 100,
  source: "spacex.com/spacexai/starmind",
} as const;

export type PartId =
  | "compute-core"
  | "solar-wing"
  | "radiator"
  | "laser-terminal"
  | "bus"
  | "thruster";

export interface PartInfo {
  id: PartId;
  kicker: string;
  title: string;
  body: string;
  stats: { label: string; value: string }[];
}

export const PART_INFO: Record<PartId, PartInfo> = {
  "compute-core": {
    id: "compute-core",
    kicker: "PAYLOAD",
    title: "Compute Core",
    body: "An orbital rack of high-density AI accelerators. Heat is pumped to deployable liquid radiators and rejected into vacuum — no chillers, no cooling towers, no water.",
    stats: [
      { label: "Peak", value: "250 kW" },
      { label: "Average", value: "175 kW" },
      { label: "Efficiency", value: "75 kW / ton" },
    ],
  },
  "solar-wing": {
    id: "solar-wing",
    kicker: "POWER",
    title: "Solar Array",
    body: "Deployable wings capture continuous sunlight in sun-synchronous orbit. No weather, no night, no atmosphere loss. Cells are SpaceX-built, Bastrop, Texas.",
    stats: [
      { label: "Wingspan", value: "75 m / 246 ft" },
      { label: "Duty cycle", value: "Near-continuous" },
      { label: "Tracking", value: "Sun-facing SSO" },
    ],
  },
  radiator: {
    id: "radiator",
    kicker: "THERMAL",
    title: "Liquid Radiator",
    body: "Mass-optimized deployable panels dump compute heat into deep space. Redundant pumping loops and micrometeoroid shielding keep the core in its thermal box.",
    stats: [
      { label: "Medium", value: "Pumped liquid" },
      { label: "Sink", value: "3 K sky" },
      { label: "Overhead", value: "~10× below Earth DC" },
    ],
  },
  "laser-terminal": {
    id: "laser-terminal",
    kicker: "LINKS",
    title: "Laser Terminal",
    body: "High-bandwidth optical crosslinks stitch the constellation together and hand results to Starlink for the last hop to Earth. Low latency. No RF dish farm.",
    stats: [
      { label: "Path", value: "AI1 → Starlink → Earth" },
      { label: "Medium", value: "Optical ISL" },
      { label: "Role", value: "Inference downlink" },
    ],
  },
  bus: {
    id: "bus",
    kicker: "SPACECRAFT",
    title: "Vehicle Bus",
    body: "A streamlined descendant of Starlink hardware: structure, avionics, power conditioning, and attitude control around a swappable compute module.",
    stats: [
      { label: "Height", value: "30 m deployed" },
      { label: "Heritage", value: "Starlink-derived" },
      { label: "Launch", value: "Starship PEZ stack" },
    ],
  },
  thruster: {
    id: "thruster",
    kicker: "GNC",
    title: "RCS Thrusters",
    body: "Cold-gas / Hall-heritage attitude jets hold sun-pointing and laser lock. Station-keeping keeps the plane clean for the rest of the constellation.",
    stats: [
      { label: "Mode", value: "Attitude + keep-out" },
      { label: "Arrays", value: "Corner quads" },
      { label: "Pointing", value: "Sun + optical" },
    ],
  },
};
