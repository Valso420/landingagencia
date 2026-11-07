import { canControlFrameGesture, isViewportZoomed, nextFrameStop, WheelGesture, type FrameStop } from '../lib/frame-navigation';

const frames = [...document.querySelectorAll<HTMLElement>('.screen-frame')];
const main = document.querySelector('main');

if (frames.length > 1 && main) {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const wheel = new WheelGesture();
  const nativeBoundary = frames.find(frame => frame.hasAttribute('data-frame-stop'));
  let boundaryEnabled = false;
  let animation = 0;
  let destination: FrameStop | undefined;
  let revision = 0;
  let effects: Animation[] = [];
  let touch: { x: number; y: number; position: number; axis: 'x' | 'y' | null; consumed: boolean; native: boolean } | undefined;

  const zoomed = () => isViewportZoomed(window.visualViewport?.scale ?? 1);
  const available = () => !main.inert && !zoomed();
  const excluded = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable], .main-menu, .phase-tools'));
  const frameBounds = () => frames.map(frame => {
    const rect = frame.getBoundingClientRect();
    return { top: rect.top + scrollY, height: rect.height, nativeScroll: frame.dataset.frameScroll === 'native', stopAfter: frame.hasAttribute('data-frame-stop') };
  });
  const releaseBoundary = () => {
    boundaryEnabled = false;
    main.classList.remove('native-scroll-bounded');
    main.style.removeProperty('--native-scroll-end');
  };
  const boundNativeScroll = () => {
    if (!nativeBoundary || destination || zoomed()) return;
    const bottom = nativeBoundary.getBoundingClientRect().bottom;
    if (!boundaryEnabled && scrollY > Math.max(nativeBoundary.getBoundingClientRect().top + scrollY, bottom + scrollY - innerHeight) + 2) return;
    // Clip overflow without creating a nested scroller: native touch inertia stops here.
    main.style.setProperty('--native-scroll-end', `${bottom - main.getBoundingClientRect().top}px`);
    main.classList.add('native-scroll-bounded');
    boundaryEnabled = true;
  };
  const beyondBoundary = (target: Element | null) => Boolean(nativeBoundary && target
    && target.getBoundingClientRect().top >= nativeBoundary.getBoundingClientRect().bottom - 2);
  const fragmentTarget = () => {
    const region = new URLSearchParams(location.search).get('region');
    return document.getElementById(location.hash.slice(1) || (region ? `region-${region}` : 'inicio'));
  };
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
  const interrupt = (event: Event) => {
    const opensMenu = event.target instanceof Element && event.target.closest('.menu-toggle')
      && (!(event instanceof KeyboardEvent) || event.key === 'Enter' || event.key === ' ');
    // Settle the selected frame before the menu captures its background and locks scroll.
    if (opensMenu && destination) window.scrollTo({ top: targetPosition(destination), behavior: 'instant' });
    cancel();
    boundNativeScroll();
    // Native anchor navigation must see the full document before its default scroll.
    if (event.type === 'click' && event.target instanceof Element && event.target.closest('a[href]')) releaseBoundary();
  };
  const reveal = (stop: FrameStop) => {
    window.scrollTo({ top: targetPosition(stop), behavior: 'instant' });
    window.dispatchEvent(new Event('framechange'));
  };
  const blurTo = async (source: HTMLElement, stop: FrameStop, onComplete?: () => void) => {
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
      const outgoing = frames.filter(frame => {
        if (frame === target) return false;
        const bounds = frame.getBoundingClientRect();
        return frame === source || (bounds.bottom > 0 && bounds.top < innerHeight);
      });
      outgoing.forEach(frame => frame.classList.add('frame-outgoing'));
      target.classList.add('frame-incoming');
      const timing: KeyframeAnimationOptions = { duration: 800, easing: 'ease-in-out', fill: 'both' };
      effects.push(...outgoing.map(frame => frame.animate([
        { opacity: 1, filter: 'blur(0px)', transform: `translateY(${shift}px)` },
        { opacity: 0, filter: 'blur(12px)', transform: `translateY(${shift}px)` },
      ], timing)));
      effects.push(target.animate([
        { opacity: 0, filter: 'blur(12px)' },
        { opacity: 1, filter: 'blur(0px)' },
      ], timing));
      reveal(stop);
      await Promise.all(effects.map(effect => effect.finished));
    } catch {
      if (active()) reveal(stop);
    } finally {
      if (currentRevision === revision) {
        const completed = active();
        cancel();
        boundNativeScroll();
        if (completed) onComplete?.();
      }
    }
  };
  const advance = (direction: number) => {
    if (destination || !available()) return;
    const bounds = frameBounds();
    if (!canControlFrameGesture(bounds, scrollY, innerHeight, direction)) return;
    const stop = nextFrameStop(bounds, scrollY, innerHeight, direction);
    if (!stop) return;
    releaseBoundary();
    const origin = scrollY;
    const start = performance.now();
    destination = stop;
    root.classList.add('is-frame-transitioning');
    window.scrollTo({ top: origin, behavior: 'instant' });
    let sourceIndex = 0;
    bounds.forEach((frame, index) => { if (frame.top <= origin + 2) sourceIndex = index; });
    const source = frames[sourceIndex];
    const sourceBounds = bounds[sourceIndex];
    const coversViewport = sourceBounds.top <= origin + 2 && sourceBounds.top + sourceBounds.height >= origin + innerHeight - 2;
    // A partial outgoing frame cannot cover the viewport during a crossfade.
    if (coversViewport && source !== frames[stop.index] && !source.matches('.hero-section') && !frames[stop.index].matches('.hero-section') && !reducedMotion.matches) {
      void blurTo(source, stop);
      return;
    }
    const tick = (time: number) => {
      if (!available()) { cancel(); return; }
      const progress = reducedMotion.matches ? 1 : Math.min(1, (time - start) / 800);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top: origin + (targetPosition(stop) - origin) * eased, behavior: 'instant' });
      if (progress < 1) animation = requestAnimationFrame(tick);
      else { cancel(); boundNativeScroll(); }
    };
    animation = requestAnimationFrame(tick);
  };

  document.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || zoomed()) { cancel(); releaseBoundary(); return; }
    if (main.inert) { wheel.consume(performance.now()); return; }
    if (excluded(event.target)) return;
    if (!boundaryEnabled) boundNativeScroll();
    const vertical = !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const direction = Math.sign(event.deltaY);
    const eligible = vertical && !canScrollInside(event.target, direction);
    const allowFrame = canControlFrameGesture(frameBounds(), scrollY, innerHeight, direction);
    const gesture = wheel.update(event.deltaY * unit, performance.now(), Boolean(destination), eligible, allowFrame);
    if (!gesture.managed || !event.cancelable) return;
    event.preventDefault();
    if (gesture.direction) advance(gesture.direction);
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    touch = undefined;
    if (event.touches.length !== 1) { cancel(); releaseBoundary(); return; }
    if (zoomed() || excluded(event.target)) return;
    if (!boundaryEnabled) boundNativeScroll();
    const point = event.touches[0];
    // A background gesture begun while the menu closes must stay consumed after unlock.
    touch = { x: point.clientX, y: point.clientY, position: scrollY, axis: null, consumed: Boolean(destination) || main.inert, native: false };
  }, { passive: true });
  document.addEventListener('touchmove', event => {
    if (!touch || zoomed()) return;
    if (event.touches.length !== 1) { touch = undefined; cancel(); releaseBoundary(); return; }
    if (main.inert) touch.consumed = true;
    const dx = touch.x - event.touches[0].clientX;
    const dy = touch.y - event.touches[0].clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      touch.native = canScrollInside(event.target, Math.sign(dy))
        || (!touch.consumed && !canControlFrameGesture(frameBounds(), touch.position, innerHeight, Math.sign(dy)));
    }
    if (touch.axis !== 'y' || touch.native || !event.cancelable) return;
    event.preventDefault();
    if (!touch.consumed && Math.abs(dy) >= 40) {
      touch.consumed = true;
      advance(Math.sign(dy));
    }
  }, { passive: false });
  const endTouch = (event: TouchEvent) => {
    touch = undefined;
    if (!event.touches.length) boundNativeScroll();
  };
  document.addEventListener('touchend', endTouch, { passive: true });
  document.addEventListener('touchcancel', endTouch, { passive: true });

  // Explicit frame links reuse the crossfade without scrolling through intervening screens.
  document.addEventListener('click', event => {
    interrupt(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !available()) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-frame-link]') : null;
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const index = frames.findIndex(frame => `#${frame.id}` === url.hash);
    const source = link.closest<HTMLElement>('.screen-frame');
    if (index < 0 || !source || source === frames[index]) return;
    event.preventDefault();
    if (url.href !== location.href) history.pushState(null, '', url);
    const stop: FrameStop = { index, offset: 0 };
    destination = stop;
    root.classList.add('is-frame-transitioning');
    wheel.consume(performance.now());
    const focusContent = () => main.focus({ preventScroll: true });
    if (reducedMotion.matches) {
      reveal(stop);
      cancel();
      boundNativeScroll();
      focusContent();
    } else void blurTo(source, stop, focusContent);
  }, { capture: true });
  // Focus navigation and history always take priority over a gesture or frame link.
  document.addEventListener('keydown', event => {
    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1
      : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1
      : event.key === ' ' && !(event.target instanceof Element && event.target.closest('a, button')) ? event.shiftKey ? -1 : 1 : 0;
    if (nativeBoundary && direction && available() && !excluded(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey
      && (destination || canControlFrameGesture(frameBounds(), scrollY, innerHeight, direction))) {
      event.preventDefault();
      if (!event.repeat) advance(direction);
      return;
    }
    interrupt(event);
    if (event.key === 'Tab' || event.key === 'Home' || event.key === 'End') releaseBoundary();
  });
  document.addEventListener('focusin', event => {
    if (!(event.target instanceof Element)) return;
    if (beyondBoundary(event.target)) {
      const wasBounded = boundaryEnabled;
      releaseBoundary();
      if (wasBounded) event.target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else boundNativeScroll();
  });
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') interrupt(event); });
  const restoreNavigation = () => {
    cancel();
    releaseBoundary();
    requestAnimationFrame(() => {
      const target = fragmentTarget();
      if (beyondBoundary(target)) target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      else boundNativeScroll();
    });
  };
  window.addEventListener('hashchange', restoreNavigation);
  window.addEventListener('popstate', restoreNavigation);
  window.addEventListener('pagehide', () => { cancel(); releaseBoundary(); });
  window.addEventListener('pageshow', event => requestAnimationFrame(() => {
    if (event.persisted || restoringHistory || !beyondBoundary(fragmentTarget())) boundNativeScroll();
  }));
  let boundaryTimer = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(boundaryTimer);
    // Let native Home/anchor scrolling finish before changing the document range.
    if (nativeBoundary && !boundaryEnabled && !destination) boundaryTimer = window.setTimeout(boundNativeScroll, 160);
  }, { passive: true });
  window.addEventListener('resize', () => {
    const wasTransitioning = Boolean(destination);
    if (destination) {
      window.scrollTo({ top: targetPosition(destination), behavior: 'instant' });
      cancel();
    }
    if (boundaryEnabled || wasTransitioning) boundNativeScroll();
  });
  let wasZoomed = zoomed();
  window.visualViewport?.addEventListener('resize', () => {
    const isZoomed = zoomed();
    if (isZoomed) { cancel(); releaseBoundary(); }
    // Initial viewport sizing must not cap a pending direct fragment visit.
    else if (boundaryEnabled || wasZoomed) boundNativeScroll();
    wasZoomed = isZoomed;
  });
  reducedMotion.addEventListener('change', () => {
    if (destination) window.scrollTo({ top: targetPosition(destination), behavior: 'instant' });
    cancel();
    boundNativeScroll();
  });
  const restoringHistory = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward';
  if (!restoringHistory && !beyondBoundary(fragmentTarget())) boundNativeScroll();
  document.fonts.ready.then(() => { if (boundaryEnabled) boundNativeScroll(); });
}
