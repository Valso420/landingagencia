import { getSceneLighting, PHASE_LABELS } from '../lib/solar';

const scene = document.querySelector<HTMLElement>('[data-window-scene]');

if (scene) {
  const labels = document.querySelectorAll<HTMLElement>('[data-phase-label]');
  const picker = import.meta.env.DEV ? document.querySelector<HTMLSelectElement>('[data-phase-picker]') : null;
  let requestedPhase = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('fase') : null;
  let timer: number | undefined;

  function refreshLighting() {
    if (!scene) return;
    const lighting = getSceneLighting(new Date(), requestedPhase, import.meta.env.DEV);
    scene.style.setProperty('--scene-night', String(lighting.night));
    scene.style.setProperty('--scene-warm', String(lighting.warm));
    scene.style.setProperty('--scene-dawn', String(lighting.dawn));
    scene.dataset.phase = lighting.phase;
    labels.forEach((label) => { label.textContent = `${PHASE_LABELS[lighting.phase]} · Buenos Aires`; });
  }

  function updateVisibility() {
    window.clearInterval(timer);
    timer = undefined;
    if (document.visibilityState === 'visible') {
      refreshLighting();
      timer = window.setInterval(refreshLighting, 3 * 60_000);
    }
  }

  if (picker) {
    picker.value = requestedPhase && [...picker.options].some((option) => option.value === requestedPhase) ? requestedPhase : 'auto';
    picker.addEventListener('change', () => {
      requestedPhase = picker.value === 'auto' ? null : picker.value;
      const url = new URL(window.location.href);
      if (requestedPhase) url.searchParams.set('fase', requestedPhase);
      else url.searchParams.delete('fase');
      window.history.replaceState(null, '', url);
      refreshLighting();
    });
  }

  // No decorative movement is used with the flattened window image.
  // Reduced-motion users keep the same solar lighting without animation.
  refreshLighting();
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('pageshow', updateVisibility);
  window.addEventListener('pagehide', () => window.clearInterval(timer));
}
