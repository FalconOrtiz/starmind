import { AI1 } from "./specs";

export type ComparisonId = "pitch" | "tesla" | "human" | "duck";

export interface ComparisonDef {
  id: ComparisonId;
  kicker: string;
  title: string;
  object: string;
  body: string;
  takeaway: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  wingspanCount: number;
  heightCount: number;
  lineCount: number;
  stackCount: number;
  stats: { label: string; value: string }[];
}

const FIFA_LENGTH = 105;
const FIFA_WIDTH = 68;
const TESLA_L = 4.72;
const TESLA_W = 1.85;
const TESLA_H = 1.441;
const HUMAN_H = 1.8;
const HUMAN_STANCE = 0.5;
const DUCK_L = 0.085;
const DUCK_W = 0.07;
const DUCK_H = 0.075;

function count(span: number, unit: number): number {
  return span / unit;
}

export const COMPARISONS: Record<ComparisonId, ComparisonDef> = {
  pitch: {
    id: "pitch",
    kicker: "SCALE",
    title: "Football Pitch",
    object: "FIFA football pitch",
    body: "A full-size FIFA pitch is 105 m long and 68 m wide. AI1 sits on the grass: 75 m of wing, 30 m tall — most of a pitch, flying, in sun-synchronous orbit.",
    takeaway: "AI1 spans 0.71 of a football pitch. The wings stop short of both goal lines.",
    lengthM: FIFA_LENGTH,
    widthM: FIFA_WIDTH,
    heightM: 0.02,
    wingspanCount: count(AI1.wingspanM, FIFA_LENGTH),
    heightCount: count(AI1.deployedHeightM, FIFA_LENGTH),
    lineCount: 1,
    stackCount: 0,
    stats: [
      { label: "Pitch", value: "105 × 68 m" },
      { label: "Wingspan", value: `${count(AI1.wingspanM, FIFA_LENGTH).toFixed(2)} pitches` },
      { label: "Height", value: `${count(AI1.deployedHeightM, FIFA_LENGTH).toFixed(2)} pitches` },
    ],
  },
  tesla: {
    id: "tesla",
    kicker: "SCALE",
    title: "Tesla Model 3",
    object: "Tesla Model 3",
    body: "A Model 3 is 4.72 m long and 1.44 m tall. Lined up on this pitch it takes 16 cars to match the 75 m wings. Stack 21 to reach the 30 m height. Hover or click a car to shove it.",
    takeaway: "16 cars long. 21 cars tall. One satellite.",
    lengthM: TESLA_L,
    widthM: TESLA_W,
    heightM: TESLA_H,
    wingspanCount: count(AI1.wingspanM, TESLA_L),
    heightCount: count(AI1.deployedHeightM, TESLA_H),
    lineCount: Math.round(count(AI1.wingspanM, TESLA_L)),
    stackCount: Math.round(count(AI1.deployedHeightM, TESLA_H)),
    stats: [
      { label: "Vehicle", value: "4.72 × 1.85 × 1.44 m" },
      { label: "Long", value: `${Math.round(count(AI1.wingspanM, TESLA_L))} cars` },
      { label: "Tall", value: `${Math.round(count(AI1.deployedHeightM, TESLA_H))} cars` },
    ],
  },
  human: {
    id: "human",
    kicker: "SCALE",
    title: "Humans",
    object: "Adult human",
    body: "An adult is 1.80 m tall and stands about 0.50 m wide. Shoulder to shoulder it takes 150 people to match the wings. Stack 17 to reach 30 m. Hover to nudge the crowd.",
    takeaway: "150 people long. 17 people tall.",
    lengthM: HUMAN_STANCE,
    widthM: 0.45,
    heightM: HUMAN_H,
    wingspanCount: count(AI1.wingspanM, HUMAN_STANCE),
    heightCount: count(AI1.deployedHeightM, HUMAN_H),
    lineCount: Math.round(count(AI1.wingspanM, HUMAN_STANCE)),
    stackCount: Math.round(count(AI1.deployedHeightM, HUMAN_H)),
    stats: [
      { label: "Person", value: "1.80 m · 0.50 m stance" },
      { label: "Long", value: `${Math.round(count(AI1.wingspanM, HUMAN_STANCE))} people` },
      { label: "Tall", value: `${Math.round(count(AI1.deployedHeightM, HUMAN_H))} people` },
    ],
  },
  duck: {
    id: "duck",
    kicker: "SCALE",
    title: "Rubber Duck",
    object: "Classic bath duck",
    body: "A classic duck is 8.5 cm long and 7.5 cm tall. 882 in a line equal the wingspan. 400 stacked equal the height. Sweep the mouse — they fly.",
    takeaway: "882 ducks long. 400 ducks tall. Poke them.",
    lengthM: DUCK_L,
    widthM: DUCK_W,
    heightM: DUCK_H,
    wingspanCount: count(AI1.wingspanM, DUCK_L),
    heightCount: count(AI1.deployedHeightM, DUCK_H),
    lineCount: Math.round(count(AI1.wingspanM, DUCK_L)),
    stackCount: Math.round(count(AI1.deployedHeightM, DUCK_H)),
    stats: [
      { label: "Duck", value: "8.5 × 7.5 cm" },
      { label: "Long", value: `${Math.round(count(AI1.wingspanM, DUCK_L))} ducks` },
      { label: "Tall", value: `${Math.round(count(AI1.deployedHeightM, DUCK_H))} ducks` },
    ],
  },
};

export const COMPARISON_ORDER: ComparisonId[] = ["pitch", "tesla", "human", "duck"];

export const HUMAN_HEIGHT_M = HUMAN_H;
export const HUMAN_STANCE_M = HUMAN_STANCE;
export const TESLA_DIM = { l: TESLA_L, w: TESLA_W, h: TESLA_H };
export const DUCK_DIM = { l: DUCK_L, w: DUCK_W, h: DUCK_H };
