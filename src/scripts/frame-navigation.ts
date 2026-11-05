import { nextFrameStop, WheelGesture, type FrameStop } from '../lib/frame-navigation';

const frames = [...document.querySelectorAll<HTMLElement>('.screen-frame')];
const main = document.querySelector('main');

if (frames.length > 1 && main) {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const wheel = new WheelGesture();
  let animation = 0;
  let destination: FrameStop | undefined;
  let revision = 0;
  let effects: Animation[] = [];
  let touch: { x: number; y: number; axis: 'x' | 'y' | null; consumed: boolean; native: boolean } | undefined;

  const available = () => !main.inert && (window.visualViewport?.scale ?? 1) <= 1;
  const excluded = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable], .main-menu, .phase-tools'));
  const canScrollInside = (target: EventTarget | null, direction: number) => {
    let element = target instanceof Element ? target : null;
    while (element && element !== main && element !== root) {
      if (element.scrollHeight > element.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(element).overflowY)) {
        if (direction < 0 ? element.scrollTop > 0 : element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
      }
      element = element.parentElement;
    }
    return false;
  };
  const targetPosition = (stop: FrameStop) => {
    const bounds = frames[stop.index].getBoundingClientRect();
    const end = Math.max(0, bounds.height - innerHeight);
    const offset = stop.offset === 'end' ? end : Math.min(stop.offset, end);
    return Math.max(0, Math.min(bounds.top + scrollY + offset, root.scrollHeight - innerHeight));
  };
  const cancel = () => {
    revision++;
    cancelAnimationFrame(animation);
    animation = 0;
    destination = undefined;
    effects.forEach(effect => effect.cancel());
    effects = [];
    frames.forEach(frame => frame.classList.remove('frame-outgoing', 'frame-incoming'));
    root.classList.remove('is-frame-transitioning', 'is-frame-blurring');
    window.dispatchEvent(new Event('framechange'));
  };
  const reveal = (stop: FrameStop) => {
    window.scrollTo({ top: targetPosition(stop), behavior: 'instant' });
    window.dispatchEvent(new Event('framechange'));
  };
  const blurTo = async (source: HTMLElement, stop: FrameStop) => {
    const currentRevision = revision;
    const target = frames[stop.index];
    const active = () => currentRevision === revision && available();
    root.classList.add('is-frame-blurring');
    try {
      // Give incoming photos a short head start without delaying navigation indefinitely.
      let timeout = 0;
      await Promise.race([
        Promise.all([...target.querySelectorAll('img')].map(async image => {
          image.loading = 'eager';
          try { await image.decode(); } catch { /* A missing image must not block navigation. */ }
        })),
        new Promise(resolve => { timeout = window.setTimeout(resolve, 300); }),
      ]);
      clearTimeout(timeout);
      if (!active()) return;
      // Keep the outgoing frame visually still while the document moves to its target.
      const shift = targetPosition(stop) - scrollY;
      source.classList.add('frame-outgoing');
      target.classList.add('frame-incoming');
      const timing: KeyframeAnimationOptions = { duration: 800, easing: 'ease-in-out', fill: 'both' };
      effects.push(source.animate([
        { opacity: 1, filter: 'blur(0px)', transform: `translateY(${shift}px)` },
        { opacity: 0, filter: 'blur(12px)', transform: `translateY(${shift}px)` },
      ], timing));
      effects.push(target.animate([
        { opacity: 0, filter: 'blur(12px)' },
        { opacity: 1, filter: 'blur(0px)' },
      ], timing));
      reveal(stop);
      await Promise.all(effects.map(effect => effect.finished));
    } catch {
      if (active()) reveal(stop);
    } finally {
      if (currentRevision === revision) cancel();
    }
  };
  const advance = (direction: number) => {
    if (destination || !available()) return;
    const bounds = frames.map(frame => {
      const rect = frame.getBoundingClientRect();
      return { top: rect.top + scrollY, height: rect.height };
    });
    const stop = nextFrameStop(bounds, scrollY, innerHeight, direction);
    if (!stop) return;
    const origin = scrollY;
    const start = performance.now();
    destination = stop;
    root.classList.add('is-frame-transitioning');
    window.scrollTo({ top: origin, behavior: 'instant' });
    let sourceIndex = 0;
    bounds.forEach((frame, index) => { if (frame.top <= origin + 2) sourceIndex = index; });
    const source = frames[sourceIndex];
    if (source !== frames[stop.index] && !source.matches('.hero-section') && !frames[stop.index].matches('.hero-section') && !reducedMotion.matches) {
      void blurTo(source, stop);
      return;
    }
    const tick = (time: number) => {
      if (!available()) { cancel(); return; }
      const progress = reducedMotion.matches ? 1 : Math.min(1, (time - start) / 800);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top: origin + (targetPosition(stop) - origin) * eased, behavior: 'instant' });
      if (progress < 1) animation = requestAnimationFrame(tick);
      else cancel();
    };
    animation = requestAnimationFrame(tick);
  };

  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || (window.visualViewport?.scale ?? 1) > 1) { cancel(); return; }
    if (!available() || excluded(event.target)) return;
    const vertical = !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const gesture = wheel.update(event.deltaY * unit, performance.now(), Boolean(destination), vertical && !canScrollInside(event.target, Math.sign(event.deltaY)));
    if (!gesture.managed || !event.cancelable) return;
    event.preventDefault();
    if (gesture.direction) advance(gesture.direction);
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    touch = undefined;
    if (event.touches.length !== 1) { cancel(); return; }
    if (!available() || excluded(event.target)) return;
    const point = event.touches[0];
    touch = { x: point.clientX, y: point.clientY, axis: null, consumed: Boolean(destination), native: false };
  }, { passive: true });
  document.addEventListener('touchmove', event => {
    if (!touch || !available()) return;
    if (event.touches.length !== 1) { touch = undefined; cancel(); return; }
    const dx = touch.x - event.touches[0].clientX;
    const dy = touch.y - event.touches[0].clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      touch.native = canScrollInside(event.target, Math.sign(dy));
    }
    if (touch.axis !== 'y' || touch.native || !event.cancelable) return;
    event.preventDefault();
    if (!touch.consumed && Math.abs(dy) >= 40) {
      touch.consumed = true;
      advance(Math.sign(dy));
    }
  }, { passive: false });
  document.addEventListener('touchend', () => { touch = undefined; }, { passive: true });
  document.addEventListener('touchcancel', () => { touch = undefined; }, { passive: true });

  // Native links, focus navigation and history always take priority over a gesture.
  document.addEventListener('click', cancel, { capture: true });
  document.addEventListener('keydown', cancel);
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') cancel(); });
  window.addEventListener('hashchange', cancel);
  window.addEventListener('popstate', cancel);
  window.addEventListener('pagehide', cancel);
  window.addEventListener('resize', () => { if (root.classList.contains('is-frame-blurring')) cancel(); });
  reducedMotion.addEventListener('change', () => {
    if (destination) window.scrollTo({ top: targetPosition(destination), behavior: 'instant' });
    cancel();
  });
}
