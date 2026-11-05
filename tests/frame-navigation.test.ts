import assert from 'node:assert/strict';
import test from 'node:test';
import { isViewportZoomed, nextFrameStop, WheelGesture, type FrameBounds } from '../src/lib/frame-navigation';

test('viewport scale rounding does not disable frame navigation at default zoom', () => {
  for (const scale of [1, 1.0000001192092896, 1.0000009536743164, 1.001]) {
    assert.equal(isViewportZoomed(scale), false);
  }
});

test('intentional zoom retains native panning', () => {
  for (const scale of [1.05, 1.25, 2, 3]) {
    assert.equal(isViewportZoomed(scale), true);
  }
});

test('a long momentum stream advances only once, including after the transition ends', () => {
  const gesture = new WheelGesture();
  const directions: number[] = [];
  for (let time = 0; time <= 2_000; time += 40) {
    const result = gesture.update(30, time, time > 0 && time < 800, true);
    assert.equal(result.managed, true);
    if (result.direction) directions.push(result.direction);
  }
  assert.deepEqual(directions, [1]);
});

test('a new gesture after a quiet interval can advance again in either direction', () => {
  const gesture = new WheelGesture();
  assert.equal(gesture.update(40, 0, false, true).direction, 1);
  assert.equal(gesture.update(40, 100, true, true).direction, 0);
  assert.equal(gesture.update(40, 1_000, false, true).direction, 1);
  assert.equal(gesture.update(-40, 2_000, false, true).direction, -1);
});

test('a gesture that starts during a transition is discarded instead of queued', () => {
  const gesture = new WheelGesture();
  for (let time = 0; time <= 1_400; time += 100) {
    assert.deepEqual(gesture.update(50, time, time < 800, true), {
      managed: true,
      direction: 0,
    });
  }
  assert.equal(gesture.update(50, 2_000, false, true).direction, 1);
});

test('wheel momentum from a locked menu is consumed after the page unlocks', () => {
  const gesture = new WheelGesture();
  for (const time of [0, 50, 100, 150]) gesture.consume(time);
  for (const time of [200, 250, 300, 350]) {
    assert.deepEqual(gesture.update(50, time, false, true), { managed: true, direction: 0 });
  }
  assert.deepEqual(gesture.update(50, 650, false, true), { managed: true, direction: 1 });
});

test('menu locking consumes an earlier native horizontal stream too', () => {
  const gesture = new WheelGesture();
  assert.deepEqual(gesture.update(20, 0, false, false), { managed: false, direction: 0 });
  gesture.consume(50);
  assert.deepEqual(gesture.update(50, 100, false, true), { managed: true, direction: 0 });
  assert.deepEqual(gesture.update(-50, 400, false, true), { managed: true, direction: -1 });
});

test('an ineligible horizontal or nested gesture remains native for its whole stream', () => {
  const gesture = new WheelGesture();
  assert.deepEqual(gesture.update(60, 0, false, false), { managed: false, direction: 0 });
  for (const time of [100, 200, 300]) {
    assert.deepEqual(gesture.update(60, time, false, true), { managed: false, direction: 0 });
  }
  assert.deepEqual(gesture.update(60, 1_000, false, true), { managed: true, direction: 1 });
});

test('small movements and a direction change do not cause accidental navigation', () => {
  const gesture = new WheelGesture();
  for (const [time, delta] of [[0, 3], [40, 3], [80, 3], [120, -3], [160, -3]] as const) {
    assert.equal(gesture.update(delta, time, false, true).direction, 0);
  }
  assert.equal(gesture.update(-40, 200, false, true).direction, -1);
});

test('switching to horizontal scrolling releases the event without allowing another frame advance', () => {
  const gesture = new WheelGesture();
  assert.equal(gesture.update(40, 0, false, true).direction, 1);
  assert.deepEqual(gesture.update(5, 100, true, false), { managed: false, direction: 0 });
  assert.deepEqual(gesture.update(40, 200, true, true), { managed: true, direction: 0 });
});

test('normal frames move one frame at a time and stop at the first and last frame', () => {
  const viewport = 800;
  const frames: FrameBounds[] = [
    { top: 0, height: viewport },
    { top: viewport, height: viewport },
    { top: viewport * 2, height: viewport },
  ];
  assert.deepEqual(nextFrameStop(frames, 0, viewport, 1), { index: 1, offset: 0 });
  assert.deepEqual(nextFrameStop(frames, viewport, viewport, 1), { index: 2, offset: 0 });
  assert.deepEqual(nextFrameStop(frames, viewport * 2, viewport, -1), { index: 1, offset: 'end' });
  assert.deepEqual(nextFrameStop(frames, viewport, viewport, -1), { index: 0, offset: 'end' });
  assert.equal(nextFrameStop(frames, 0, viewport, -1), undefined);
  assert.equal(nextFrameStop(frames, viewport * 2, viewport, 1), undefined);
  assert.equal(nextFrameStop(frames, viewport, viewport, 0), undefined);
});

test('empty and single-screen pages have no adjacent frame to navigate to', () => {
  for (const direction of [-1, 0, 1]) {
    assert.equal(nextFrameStop([], 0, 800, direction), undefined);
    assert.equal(nextFrameStop([{ top: 0, height: 800 }], 0, 800, direction), undefined);
  }
});

test('a tall frame is read in overlapping portions before advancing to the next frame', () => {
  const viewport = 800;
  const tallHeight = 1_800;
  const end = tallHeight - viewport;
  const frames: FrameBounds[] = [
    { top: 0, height: tallHeight },
    { top: tallHeight, height: viewport },
  ];
  let position = 0;
  const offsets = [position];
  for (let step = 0; step < 10; step++) {
    const stop = nextFrameStop(frames, position, viewport, 1);
    assert.ok(stop);
    if (stop.index === 1) {
      assert.equal(position, end, 'The bottom of the current frame must be visible before leaving it.');
      assert.equal(stop.offset, 0);
      break;
    }
    assert.equal(stop.index, 0);
    assert.equal(typeof stop.offset, 'number');
    const offset = stop.offset as number;
    assert.ok(offset > position && offset - position < viewport, 'Reading portions must advance with overlap.');
    assert.ok(offset <= end, 'Reading must not overshoot the bottom of the tall frame.');
    position = offset;
    offsets.push(position);
  }
  assert.equal(offsets.at(-1), end);
  assert.ok(offsets.length >= 3, 'Tall content must not be skipped in one move.');
  assert.deepEqual(nextFrameStop(frames, tallHeight, viewport, -1), { index: 0, offset: 'end' });
});

test('moving upward reads the remaining tall content before returning to the previous frame', () => {
  const viewport = 800;
  const frames: FrameBounds[] = [
    { top: 0, height: viewport },
    { top: viewport, height: 1_800 },
  ];
  let offset = 1_000;
  for (let step = 0; step < 10 && offset > 0; step++) {
    const stop = nextFrameStop(frames, viewport + offset, viewport, -1);
    assert.ok(stop);
    assert.equal(stop.index, 1);
    assert.equal(typeof stop.offset, 'number');
    const previousOffset = stop.offset as number;
    assert.ok(previousOffset >= 0 && previousOffset < offset);
    assert.ok(offset - previousOffset < viewport, 'Upward reading must preserve overlap.');
    offset = previousOffset;
  }
  assert.equal(offset, 0);
  assert.deepEqual(nextFrameStop(frames, viewport, viewport, -1), { index: 0, offset: 'end' });
});
