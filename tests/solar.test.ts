import assert from 'node:assert/strict';
import test from 'node:test';
import { getAutomaticLighting, getSceneLighting, SOLAR_PHASES } from '../src/lib/solar';

test('injected absolute dates cover the four Buenos Aires solar phases', () => {
  const examples = [
    ['2026-11-04T08:45:00Z', 'amanecer'],
    ['2026-11-04T15:00:00Z', 'dia'],
    ['2026-11-04T22:30:00Z', 'atardecer'],
    ['2026-11-04T03:00:00Z', 'noche'],
  ] as const;
  for (const [date, phase] of examples) {
    assert.equal(getAutomaticLighting(new Date(date)).phase, phase, date);
  }
});

test('day preserves the original photo and night uses the deep-blue layer', () => {
  assert.deepEqual(getAutomaticLighting(new Date('2026-11-04T15:00:00Z')), {
    phase: 'dia', night: 0, warm: 0, dawn: 0,
  });
  assert.deepEqual(getAutomaticLighting(new Date('2026-11-04T03:00:00Z')), {
    phase: 'noche', night: 1, warm: 0, dawn: 0,
  });
  assert.ok(getAutomaticLighting(new Date('2026-11-04T08:45:00Z')).dawn > 0.5);
  assert.ok(getAutomaticLighting(new Date('2026-11-04T22:30:00Z')).warm > 0.5);
});

test('lighting follows seasonal sun position instead of a fixed clock schedule', () => {
  const summer = getAutomaticLighting(new Date('2026-01-15T09:00:00Z'));
  const winter = getAutomaticLighting(new Date('2026-07-15T09:00:00Z'));
  assert.equal(summer.phase, 'amanecer');
  assert.equal(winter.phase, 'noche');
  assert.ok(summer.night < winter.night);
});

test('the same instant produces the same lighting for different date offsets and host timezones', () => {
  const expected = getAutomaticLighting(new Date('2026-11-04T08:45:00Z'));
  assert.deepEqual(getAutomaticLighting(new Date('2026-11-04T05:45:00-03:00')), expected);
  assert.deepEqual(getAutomaticLighting(new Date('2026-11-04T17:45:00+09:00')), expected);
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ['America/Argentina/Buenos_Aires', 'Asia/Tokyo', 'Pacific/Honolulu']) {
      process.env.TZ = timezone;
      assert.deepEqual(getAutomaticLighting(new Date('2026-11-04T08:45:00Z')), expected);
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test('lighting remains bounded and continuous through a whole day, including phase boundaries', () => {
  const start = Date.parse('2026-11-04T00:00:00Z');
  let previous = getAutomaticLighting(new Date(start));
  for (let minute = 1; minute <= 24 * 60; minute++) {
    const current = getAutomaticLighting(new Date(start + minute * 60_000));
    for (const layer of ['night', 'warm', 'dawn'] as const) {
      assert.ok(current[layer] >= 0 && current[layer] <= 1, `${layer} bounds at minute ${minute}`);
      assert.ok(Math.abs(current[layer] - previous[layer]) < 0.06, `${layer} continuity at minute ${minute}`);
    }
    previous = current;
  }
});

test('phase preview is available only in development and invalid values preserve automatic mode', () => {
  const date = new Date('2026-11-04T15:00:00Z');
  const automatic = getAutomaticLighting(date);
  for (const phase of SOLAR_PHASES) {
    assert.equal(getSceneLighting(date, phase, true).phase, phase);
    assert.deepEqual(getSceneLighting(date, phase, false), automatic);
  }
  assert.deepEqual(getSceneLighting(date, 'invalid', true), automatic);
  assert.deepEqual(getSceneLighting(date, 'auto', true), automatic);
  assert.deepEqual(getSceneLighting(date), automatic);
});

test('an invalid injected date is rejected explicitly', () => {
  assert.throws(() => getAutomaticLighting(new Date('invalid')), RangeError);
});
