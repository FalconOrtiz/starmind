function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function solarCellTexture(): HTMLCanvasElement {
  const c = makeCanvas(2048, 1024);
  const g = c.getContext("2d")!;
  g.fillStyle = "#071018";
  g.fillRect(0, 0, 2048, 1024);

  const cols = 72;
  const rows = 36;
  const padX = 18;
  const padY = 18;
  const gap = 4;
  const cw = (2048 - padX * 2 - gap * (cols - 1)) / cols;
  const ch = (1024 - padY * 2 - gap * (rows - 1)) / rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = padX + x * (cw + gap);
      const py = padY + y * (ch + gap);
      const hue = 205 + ((x * 13 + y * 7) % 9);
      const lit = 10 + ((x * 5 + y * 3) % 7);
      g.fillStyle = `hsl(${hue} 55% ${lit}%)`;
      g.fillRect(px, py, cw, ch);

      const grad = g.createLinearGradient(px, py, px + cw, py + ch);
      grad.addColorStop(0, "rgba(120,190,255,0.16)");
      grad.addColorStop(0.45, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(20,40,80,0.25)");
      g.fillStyle = grad;
      g.fillRect(px, py, cw, ch);

      g.strokeStyle = "rgba(196,154,68,0.55)";
      g.lineWidth = 1;
      g.beginPath();
      for (let i = 1; i < 4; i++) {
        g.moveTo(px + (cw * i) / 4, py + 1);
        g.lineTo(px + (cw * i) / 4, py + ch - 1);
      }
      g.stroke();
    }
  }

  g.strokeStyle = "rgba(210,180,90,0.35)";
  g.lineWidth = 3;
  g.strokeRect(8, 8, 2032, 1008);
  return c;
}

export function busPanelTexture(): HTMLCanvasElement {
  const c = makeCanvas(1024, 1024);
  const g = c.getContext("2d")!;
  g.fillStyle = "#16181c";
  g.fillRect(0, 0, 1024, 1024);

  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = 64 + i * 120;
    g.beginPath();
    g.moveTo(24, y);
    g.lineTo(1000, y);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x = 48 + i * 160;
    g.beginPath();
    g.moveTo(x, 24);
    g.lineTo(x, 1000);
    g.stroke();
  }

  g.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 40; y < 1000; y += 40) {
    for (let x = 40; x < 1000; x += 40) {
      g.beginPath();
      g.arc(x, y, 1.2, 0, Math.PI * 2);
      g.fill();
    }
  }

  g.fillStyle = "rgba(190,200,210,0.12)";
  g.fillRect(80, 80, 220, 36);
  g.font = "600 28px sans-serif";
  g.fillStyle = "rgba(230,235,240,0.55)";
  g.fillText("AI1", 92, 108);

  return c;
}

export function mlITexture(): HTMLCanvasElement {
  const c = makeCanvas(512, 512);
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "#c9a24a");
  grad.addColorStop(0.35, "#8a5a22");
  grad.addColorStop(0.7, "#d8b56a");
  grad.addColorStop(1, "#6a3e16");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  g.globalAlpha = 0.18;
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = i % 2 ? "#fff" : "#000";
    g.beginPath();
    g.moveTo(i * 18, 0);
    g.lineTo(i * 18 - 80, 512);
    g.stroke();
  }
  g.globalAlpha = 1;
  return c;
}

export function radiatorTexture(): HTMLCanvasElement {
  const c = makeCanvas(1024, 2048);
  const g = c.getContext("2d")!;
  g.fillStyle = "#d8dde4";
  g.fillRect(0, 0, 1024, 2048);
  for (let y = 4; y < 2048; y += 7) {
    g.fillStyle = y % 14 === 4 ? "#c5cad0" : "#e4e8ed";
    g.fillRect(0, y, 1024, 3);
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(0, y, 1024, 1);
    g.fillStyle = "rgba(40,50,60,0.2)";
    g.fillRect(0, y + 3, 1024, 1);
  }
  g.fillStyle = "rgba(70,80,90,0.35)";
  g.fillRect(508, 0, 8, 2048);
  return c;
}

export function grassTexture(): HTMLCanvasElement {
  const c = makeCanvas(2048, 1365);
  const g = c.getContext("2d")!;
  const stripes = 12;
  const sw = 2048 / stripes;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? "#3d7a32" : "#356c2c";
    g.fillRect(i * sw, 0, sw + 1, 1365);
  }
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 1365;
    g.fillStyle = `rgba(20,40,10,${0.04 + Math.random() * 0.08})`;
    g.fillRect(x, y, 1, 2 + Math.random() * 3);
  }
  return c;
}

export function pitchLinesTexture(): HTMLCanvasElement {
  const c = makeCanvas(2100, 1360);
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 2100, 1360);

  const ppm = 20;
  const midX = 1050;
  const midZ = 680;
  const halfL = 52.5 * ppm;
  const halfW = 34 * ppm;
  const left = midX - halfL;
  const right = midX + halfL;
  const top = midZ - halfW;
  const bot = midZ + halfW;

  g.strokeStyle = "rgba(255,255,255,0.94)";
  g.fillStyle = "#fff";
  g.lineWidth = 5;
  g.lineJoin = "miter";

  g.strokeRect(left, top, halfL * 2, halfW * 2);

  g.beginPath();
  g.moveTo(midX, top);
  g.lineTo(midX, bot);
  g.stroke();

  g.beginPath();
  g.arc(midX, midZ, 9.15 * ppm, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(midX, midZ, 3.2, 0, Math.PI * 2);
  g.fill();

  const penD = 16.5 * ppm;
  const penH = 40.32 * ppm;
  const sixD = 5.5 * ppm;
  const sixH = 18.32 * ppm;
  const goalH = 7.32 * ppm;
  const spot = 11 * ppm;
  const arcR = 9.15 * ppm;

  g.strokeRect(left, midZ - penH / 2, penD, penH);
  g.strokeRect(right - penD, midZ - penH / 2, penD, penH);
  g.strokeRect(left, midZ - sixH / 2, sixD, sixH);
  g.strokeRect(right - sixD, midZ - sixH / 2, sixD, sixH);

  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(left, midZ - goalH / 2);
  g.lineTo(left, midZ + goalH / 2);
  g.stroke();
  g.beginPath();
  g.moveTo(right, midZ - goalH / 2);
  g.lineTo(right, midZ + goalH / 2);
  g.stroke();

  g.strokeStyle = "rgba(255,255,255,0.94)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(left + spot, midZ, 3.2, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(right - spot, midZ, 3.2, 0, Math.PI * 2);
  g.fill();

  const penEdge = 16.5;
  const ang = Math.acos(Math.min(1, (penEdge - 11) / 9.15));
  g.beginPath();
  g.arc(left + spot, midZ, arcR, -ang, ang);
  g.stroke();
  g.beginPath();
  g.arc(right - spot, midZ, arcR, Math.PI - ang, Math.PI + ang);
  g.stroke();

  const corner = 1 * ppm;
  g.beginPath();
  g.arc(left, top, corner, 0, Math.PI / 2);
  g.stroke();
  g.beginPath();
  g.arc(right, top, corner, Math.PI / 2, Math.PI);
  g.stroke();
  g.beginPath();
  g.arc(left, bot, corner, -Math.PI / 2, 0);
  g.stroke();
  g.beginPath();
  g.arc(right, bot, corner, Math.PI, Math.PI * 1.5);
  g.stroke();

  return c;
}
