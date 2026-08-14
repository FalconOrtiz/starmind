/** Two-finger pinch tracker. Span shrink → zoom out factor > 1. */
export class PinchZoom {
  readonly pointers = new Map<number, { x: number; y: number }>();
  pinching = false;
  private startSpan = 0;
  private startValue = 0;

  down(id: number, x: number, y: number, currentValue: number): void {
    this.pointers.set(id, { x, y });
    if (this.pointers.size >= 2) {
      this.pinching = true;
      this.startSpan = this.span();
      this.startValue = currentValue;
    }
  }

  move(id: number, x: number, y: number): number | null {
    const p = this.pointers.get(id);
    if (!p) return null;
    p.x = x;
    p.y = y;
    if (!this.pinching || this.pointers.size < 2 || this.startSpan < 10) return null;
    return this.startValue * (this.startSpan / Math.max(10, this.span()));
  }

  /** Extra log-scale offset for 0..1 sliders (pinch in → positive). */
  moveLog(id: number, x: number, y: number, scale = 0.7): number | null {
    const p = this.pointers.get(id);
    if (!p) return null;
    p.x = x;
    p.y = y;
    if (!this.pinching || this.pointers.size < 2 || this.startSpan < 10) return null;
    const ratio = this.startSpan / Math.max(10, this.span());
    return this.startValue + Math.log(ratio) * scale;
  }

  up(id: number): void {
    this.pointers.delete(id);
    if (this.pointers.size < 2) this.pinching = false;
  }

  clear(): void {
    this.pointers.clear();
    this.pinching = false;
  }

  private span(): number {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }
}

export function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
}
