export interface FrameBounds { top: number; height: number; nativeScroll?: boolean }
export interface FrameStop { index: number; offset: number | 'end' }

export function isViewportZoomed(scale: number): boolean {
  // Mobile browsers can report a scale slightly above 1 at the default zoom.
  return scale > 1.01;
}

export function nextFrameStop(frames: FrameBounds[], position: number, viewport: number, direction: number): FrameStop | undefined {
  if (!frames.length || !direction) return;
  let index = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].top <= position + 2) index = i;
  }
  const frame = frames[index];
  const offset = Math.max(0, position - frame.top);
  const end = Math.max(0, frame.height - viewport);
  if (direction > 0) {
    if (offset < end - 2) return { index, offset: Math.min(end, offset + viewport * .85) };
    if (index < frames.length - 1) return { index: index + 1, offset: 0 };
  } else {
    if (offset > 2) return { index, offset: Math.max(0, offset - viewport * .85) };
    if (index > 0) return { index: index - 1, offset: 'end' };
  }
}

export function canControlFrameGesture(frames: FrameBounds[], position: number, viewport: number, direction: number): boolean {
  if (!frames.length) return false;
  let index = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].top <= position + 2) index = i;
  }
  const frame = frames[index];
  if (frame.nativeScroll) return false;
  const stop = nextFrameStop(frames, position, viewport, direction);
  // Partial screens at native boundaries should not be pulled back into alignment.
  if (stop?.index === index && frame.height <= viewport + 2 && position > frame.top + 2
    && (frames[index - 1]?.nativeScroll || frames[index + 1]?.nativeScroll)) return false;
  return !stop || !frames[stop.index].nativeScroll;
}

// Trackpad momentum belongs to the same gesture until the wheel goes quiet.
export class WheelGesture {
  private lastEvent = -Infinity;
  private amount = 0;
  private consumed = false;
  private managed = false;

  consume(time: number) {
    this.lastEvent = time;
    this.amount = 0;
    this.consumed = true;
    this.managed = true;
  }

  update(delta: number, time: number, busy: boolean, eligible: boolean, allowFrame = true) {
    if (time - this.lastEvent > 240) {
      this.amount = 0;
      this.consumed = busy;
      this.managed = eligible && (busy || allowFrame);
    }
    this.lastEvent = time;
    if (!eligible) this.consumed = true;
    const managed = this.managed && eligible;
    if (!managed || this.consumed) return { managed, direction: 0 };
    if (Math.sign(delta) !== Math.sign(this.amount)) this.amount = 0;
    this.amount += delta;
    if (Math.abs(this.amount) < 24) return { managed: true, direction: 0 };
    this.consumed = true;
    return { managed: true, direction: Math.sign(this.amount) };
  }
}
