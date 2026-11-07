import { isViewportZoomed, WheelGesture } from '../lib/frame-navigation';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-destination-deck]').forEach(deck => {
  const list = deck.querySelector<HTMLElement>('.destination-cards');
  const items = [...deck.querySelectorAll<HTMLElement>('.destination-card-item')];
  const controls = deck.querySelector<HTMLElement>('.destination-controls');
  const previous = deck.querySelector<HTMLButtonElement>('.destination-previous');
  const next = deck.querySelector<HTMLButtonElement>('.destination-next');
  const position = deck.querySelector<HTMLElement>('.destination-position');
  if (!list || !items.length || !controls || !previous || !next || !position) return;

  let index = 0;
  let effects: Animation[] = [];
  let revision = 0;
  let touch: { x: number; y: number; axis: 'x' | 'y' | null; consumed: boolean } | undefined;
  let suppressClick = false;
  let suppressClickUntil = 0;
  const wheel = new WheelGesture();
  const available = () => !deck.closest('main')?.inert
    && !isViewportZoomed(window.visualViewport?.scale ?? 1);

  const settle = () => {
    effects.forEach(effect => effect.cancel());
    effects = [];
    items.forEach((item, candidate) => {
      item.hidden = candidate !== index;
      item.inert = candidate !== index;
      if (candidate === index) item.removeAttribute('aria-hidden');
      else item.setAttribute('aria-hidden', 'true');
    });
  };

  const updateControls = () => {
    previous.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === items.length - 1));
    position.replaceChildren();
    const count = document.createElement('span');
    count.setAttribute('aria-hidden', 'true');
    count.textContent = `${index + 1} / ${items.length}`;
    const announcement = document.createElement('span');
    announcement.className = 'sr-only';
    announcement.textContent = `${items[index].dataset.destinationName}, ${index + 1} de ${items.length}`;
    position.append(count, announcement);
  };

  const warmImages = () => {
    items.slice(Math.max(0, index - 1), index + 2).forEach(item => {
      item.querySelector<HTMLImageElement>('.destination-card > img')?.setAttribute('loading', 'eager');
    });
  };

  const change = (candidate: number) => {
    const target = Math.max(0, Math.min(items.length - 1, candidate));
    if (target === index) return;
    const currentRevision = ++revision;
    settle();
    const outgoing = items[index];
    const transferFocus = outgoing.contains(document.activeElement);
    index = target;
    const incoming = items[index];
    incoming.hidden = false;
    incoming.inert = false;
    incoming.removeAttribute('aria-hidden');
    if (transferFocus) incoming.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
    updateControls();
    warmImages();
    if (reducedMotion.matches) { settle(); return; }
    const timing: KeyframeAnimationOptions = { duration: 220, easing: 'ease-out', fill: 'both' };
    effects = [
      outgoing.animate([{ opacity: 1 }, { opacity: 0 }], timing),
      incoming.animate([{ opacity: 0 }, { opacity: 1 }], timing),
    ];
    void Promise.all(effects.map(effect => effect.finished)).catch(() => {}).finally(() => {
      if (revision === currentRevision) settle();
    });
  };

  previous.addEventListener('click', () => change(index - 1));
  next.addEventListener('click', () => change(index + 1));
  deck.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || !available()) return;
    const target = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : undefined;
    if (target === undefined) return;
    event.preventDefault();
    change(target);
  });

  deck.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || !available()) return;
    const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
    const dy = event.shiftKey ? 0 : event.deltaY;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? list.clientWidth : 1;
    const gesture = wheel.update(dx * unit, performance.now(), false, horizontal, horizontal, true);
    if (!gesture.managed) return;
    // Keep diagonal momentum in the same horizontal gesture, including at an end card.
    if (event.cancelable) event.preventDefault();
    if (gesture.direction) change(index + gesture.direction);
  }, { passive: false });

  deck.addEventListener('touchstart', event => {
    suppressClick = false;
    touch = event.touches.length === 1 && available()
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY, axis: null, consumed: false }
      : undefined;
  }, { passive: true });
  deck.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1 || !available()) { touch = undefined; return; }
    const dx = touch.x - event.touches[0].clientX;
    const dy = touch.y - event.touches[0].clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (touch.axis !== 'x') return;
    if (event.cancelable) event.preventDefault();
    suppressClick = true;
    suppressClickUntil = performance.now() + 400;
    if (!touch.consumed && Math.abs(dx) >= 40) {
      touch.consumed = true;
      change(index + Math.sign(dx));
    }
  }, { passive: false });
  const endTouch = () => { touch = undefined; };
  deck.addEventListener('touchend', endTouch, { passive: true });
  deck.addEventListener('touchcancel', endTouch, { passive: true });
  deck.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') suppressClick = false;
  });
  deck.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0 || performance.now() > suppressClickUntil) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });
  reducedMotion.addEventListener('change', () => { revision++; settle(); });
  window.addEventListener('pagehide', () => { revision++; settle(); touch = undefined; suppressClick = false; });

  settle();
  updateControls();
  warmImages();
  deck.classList.add('is-enhanced');
  controls.hidden = false;
});
