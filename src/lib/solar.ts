import { getPosition } from 'suncalc';

export const BUENOS_AIRES = { latitude: -34.6, longitude: -58.38 } as const;

export const SOLAR_PHASES = ['amanecer', 'dia', 'atardecer', 'noche'] as const;
export type SolarPhase = (typeof SOLAR_PHASES)[number];

export interface SceneLighting {
  phase: SolarPhase;
  night: number;
  warm: number;
  dawn: number;
}

export const PHASE_LABELS: Record<SolarPhase, string> = {
  amanecer: 'Amanecer',
  dia: 'Día',
  atardecer: 'Atardecer',
  noche: 'Noche',
};

const PREVIEW_LIGHTING: Record<SolarPhase, SceneLighting> = {
  amanecer: { phase: 'amanecer', night: 0.35, warm: 0, dawn: 0.85 },
  dia: { phase: 'dia', night: 0, warm: 0, dawn: 0 },
  atardecer: { phase: 'atardecer', night: 0.35, warm: 1, dawn: 0 },
  noche: { phase: 'noche', night: 1, warm: 0, dawn: 0 },
};

function smoothstep(start: number, end: number, value: number): number {
  const fraction = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return fraction * fraction * (3 - 2 * fraction);
}

function solarAltitude(date: Date): number {
  // SunCalc 2 returns altitude in degrees, based on the absolute instant.
  return getPosition(date, BUENOS_AIRES.latitude, BUENOS_AIRES.longitude).altitude;
}

export function getAutomaticLighting(date: Date): SceneLighting {
  const instant = date.getTime();
  if (!Number.isFinite(instant)) throw new RangeError('A valid date is required.');

  const altitude = solarAltitude(date);
  const rising = solarAltitude(new Date(instant + 60_000)) > solarAltitude(new Date(instant - 60_000));
  const night = 1 - smoothstep(-8, 8, altitude);
  const twilight = smoothstep(-8, 0, altitude) * (1 - smoothstep(0, 8, altitude));
  const phase: SolarPhase = altitude <= -8 ? 'noche' : altitude >= 8 ? 'dia' : rising ? 'amanecer' : 'atardecer';

  return {
    phase,
    night,
    warm: rising ? 0 : twilight,
    dawn: rising ? twilight * 0.85 : 0,
  };
}

export function getSceneLighting(date: Date, requestedPhase: string | null = null, development = false): SceneLighting {
  if (development && SOLAR_PHASES.some((phase) => phase === requestedPhase)) {
    return { ...PREVIEW_LIGHTING[requestedPhase as SolarPhase] };
  }
  return getAutomaticLighting(date);
}
