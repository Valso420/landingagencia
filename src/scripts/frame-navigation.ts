import { canControlFrameGesture, isViewportZoomed, nextFrameStop, restingFrameStop, WheelGesture, type FrameStop } from '../lib/frame-navigation';

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
  let selected: FrameStop | undefined;
  let nativeNavigation = false;
  let resizeFrame = 0;
  let boundaryTimer = 0;
  const supportsScrollEnd = 'onscrollend' in document;
  let scrollPending = false;
  let scrollInProgress = false;
  let activeTouches = 0;
  let lastWheelTime = -Infinity;
  let touch: { x: number; y: number; position: number; axis: 'x' | 'y' | null; consumed: boolean; native: boolean; contained: boolean; horizontal: boolean } | undefined;

  frames.filter(frame => frame.dataset.frameScroll !== 'native').forEach(frame => frame.classList.add('frame-managed'));

  const zoomed = () => isViewportZoomed(window.visualViewport?.scale ?? 1);
  const available = () => !main.inert && !zoomed();
  const excluded = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable], .main-menu, .phase-tools'));
  const frameBounds = () => frames.map(frame => {
    const rect = frame.getBoundingClientRect();
    return { top: rect.top + scrollY, height: rect.height, nativeScroll: frame.dataset.frameScroll === 'native', stopAfter: frame.hasAttribute('data-frame-stop') };
  });
  const updateTouchAction = () => {
    const bounds = frameBounds();
    // Touch permissions must be set before a gesture starts, including at native boundaries.
    const up = !canControlFrameGesture(bounds, scrollY, innerHeight, -1);
    const down = !canControlFrameGesture(bounds, scrollY, innerHeight, 1);
    const vertical = up && down ? 'pan-y' : up ? 'pan-up' : down ? 'pan-down' : '';
    root.style.setProperty('--frame-touch-action', `pan-x ${vertical} pinch-zoom`);
  };
  const select = (stop?: FrameStop) => {
    if (stop) nativeNavigation = false;
    selected = stop && frames[stop.index].dataset.frameScroll !== 'native' ? stop : undefined;
    root.classList.toggle('is-frame-controlled', Boolean(selected));
    updateTouchAction();
  };
  const rememberPosition = () => {
    if (destination || main.inert || zoomed() || nativeNavigation) return;
    select(restingFrameStop(frameBounds(), scrollY, innerHeight));
  };
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
  const horizontalScroller = (target: EventTarget | null) => target instanceof Element
    ? target.closest('.destination-deck')?.querySelector<HTMLElement>('.destination-cards') : null;
  const targetPosition = (stop: FrameStop) => {
    const bounds = frames[stop.index].getBoundingClientRect();
    const end = Math.max(0, bounds.height - innerHeight);
    const offset = stop.offset === 'end' ? end : Math.min(stop.offset, end);
    return Math.max(0, Math.min(bounds.top + scrollY + offset, root.scrollHeight - innerHeight));
  };
  const cancel = () => {
    clearTimeout(boundaryTimer);
    scrollPending = false;
    revision++;
    cancelAnimationFrame(animation);
    animation = 0;
    destination = undefined;
    effects.forEach(effect => effect.cancel());
    effects = [];
    frames.forEach(frame => frame.classList.remove('frame-outgoing', 'frame-incoming'));
    root.classList.remove('is-frame-transitioning', 'is-frame-blurring');
    updateTouchAction();
    window.dispatchEvent(new Event('framechange'));
  };
  const interrupt = (event: Event) => {
    clearTimeout(boundaryTimer);
    // An interruption must not leave an eased transition between two frames.
    const stop = destination;
    cancel();
    if (stop) reveal(stop);
    boundNativeScroll();
    // Native anchor navigation must see the full document before its default scroll.
    if (event.type === 'click' && event.target instanceof Element) {
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (link) {
        releaseBoundary();
        const url = new URL(link.href);
        if (event instanceof MouseEvent && !event.button && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey
          && !link.hasAttribute('download') && (!link.target || link.target === '_self')
          && url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) {
          select();
          nativeNavigation = true;
        }
      }
    }
  };
  const reveal = (stop: FrameStop) => {
    select(stop);
    window.scrollTo({ top: targetPosition(stop), behavior: 'instant' });
    window.dispatchEvent(new Event('framechange'));
  };
  const settleScroll = () => {
    clearTimeout(boundaryTimer);
    if (!scrollPending || activeTouches || (supportsScrollEnd && scrollInProgress)
      || destination || resizeFrame || !available()) return;
    // Wheel momentum belongs to one gesture until the existing 240 ms threshold passes.
    const wheelWait = 260 - (performance.now() - lastWheelTime);
    if (wheelWait > 0) { boundaryTimer = window.setTimeout(settleScroll, wheelWait); return; }
    scrollPending = false;
    scrollInProgress = false;
    const explicitNavigation = nativeNavigation;
    nativeNavigation = false;
    if (!selected) rememberPosition();
    // A native gesture can enter a region without ever revealing its recorded stop.
    if (!explicitNavigation && selected && Math.abs(scrollY - targetPosition(selected)) > 1) reveal(selected);
    boundNativeScroll();
  };
  const scheduleScrollSettlement = () => {
    clearTimeout(boundaryTimer);
    if (scrollPending) boundaryTimer = window.setTimeout(settleScroll, 160);
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
      else { select(stop); cancel(); boundNativeScroll(); }
    };
    animation = requestAnimationFrame(tick);
  };

  document.addEventListener('wheel', event => {
    lastWheelTime = performance.now();
    clearTimeout(boundaryTimer);
    if (!supportsScrollEnd || !scrollInProgress) scheduleScrollSettlement();
    if (event.ctrlKey || event.metaKey || zoomed()) { cancel(); select(); releaseBoundary(); return; }
    if (main.inert) { wheel.consume(performance.now()); return; }
    if (event.defaultPrevented) { wheel.consume(performance.now()); return; }
    if (excluded(event.target)) return;
    if (nativeNavigation || !selected) { nativeNavigation = false; rememberPosition(); }
    if (!boundaryEnabled) boundNativeScroll();
    const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
    const dy = event.shiftKey ? 0 : event.deltaY;
    const vertical = Math.abs(dy) > Math.abs(dx);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const direction = Math.sign(dy);
    const nested = canScrollInside(event.target, direction);
    const eligible = vertical && !nested;
    const allowFrame = canControlFrameGesture(frameBounds(), scrollY, innerHeight, direction);
    const contain = !nested && Boolean(selected || destination);
    const gesture = wheel.update(dy * unit, performance.now(), Boolean(destination), eligible, allowFrame, contain);
    if (!gesture.managed) {
      if (eligible) select();
      return;
    }
    if (!vertical) {
      // Keep native fallback lists usable without moving an enhanced card slot.
      if (dy && event.cancelable) {
        event.preventDefault();
        const scroller = horizontalScroller(event.target);
        if (scroller && !scroller.closest('.destination-deck.is-enhanced')) scroller.scrollLeft += dx * unit;
      }
      return;
    }
    if (event.cancelable) event.preventDefault();
    if (gesture.direction) advance(gesture.direction);
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    clearTimeout(boundaryTimer);
    activeTouches = event.touches.length;
    touch = undefined;
    if (event.touches.length !== 1) { cancel(); select(); releaseBoundary(); return; }
    if (zoomed() || excluded(event.target)) return;
    if (!main.inert && (nativeNavigation || !selected)) { nativeNavigation = false; rememberPosition(); }
    if (!boundaryEnabled) boundNativeScroll();
    const point = event.touches[0];
    // A background gesture begun while the menu closes must stay consumed after unlock.
    touch = { x: point.clientX, y: point.clientY, position: scrollY, axis: null, consumed: Boolean(destination) || main.inert, native: false, contained: Boolean(selected || destination), horizontal: Boolean(horizontalScroller(event.target)) };
  }, { passive: true });
  document.addEventListener('touchmove', event => {
    activeTouches = event.touches.length;
    if (!touch || zoomed()) return;
    if (event.touches.length !== 1) { touch = undefined; cancel(); select(); releaseBoundary(); return; }
    if (main.inert) touch.consumed = true;
    const dx = touch.x - event.touches[0].clientX;
    const dy = touch.y - event.touches[0].clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
      if (touch.contained) {
        if (touch.horizontal && Math.abs(dx) > Math.abs(dy)) touch.axis = 'x';
        else if (Math.abs(dy) >= 8) touch.axis = 'y';
      } else touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (touch.axis) touch.native = canScrollInside(event.target, Math.sign(dy))
        || (!touch.consumed && !canControlFrameGesture(frameBounds(), touch.position, innerHeight, Math.sign(dy)));
    }
    if (touch.axis !== 'y') return;
    if (touch.native) { select(); return; }
    // CSS can already prevent native panning, making the event non-cancelable.
    if (event.cancelable) event.preventDefault();
    if (!touch.consumed && Math.abs(dy) >= 40) {
      touch.consumed = true;
      advance(Math.sign(dy));
    }
  }, { passive: false });
  const endTouch = (event: TouchEvent) => {
    activeTouches = event.touches.length;
    touch = undefined;
    if (!activeTouches) {
      boundNativeScroll();
      if (!supportsScrollEnd || !scrollInProgress) scheduleScrollSettlement();
    }
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
    if (main.inert || event.defaultPrevented || excluded(event.target)) return;
    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1
      : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1
      : event.key === ' ' && !(event.target instanceof Element && event.target.closest('button')) ? event.shiftKey ? -1 : 1 : 0;
    if (nativeBoundary && direction && available() && !excluded(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey
      && (destination || canControlFrameGesture(frameBounds(), scrollY, innerHeight, direction))) {
      event.preventDefault();
      if (!event.repeat) advance(direction);
      return;
    }
    interrupt(event);
    if (direction || event.key === 'Tab' || event.key === 'Home' || event.key === 'End') {
      select();
      nativeNavigation = true;
      releaseBoundary();
    }
  });
  document.addEventListener('focusin', event => {
    clearTimeout(boundaryTimer);
    scrollPending = false;
    if (!(event.target instanceof Element)) return;
    const frame = event.target.closest<HTMLElement>('.screen-frame');
    if (frame && frame.dataset.frameScroll !== 'native') {
      releaseBoundary();
      const index = frames.indexOf(frame);
      const bottom = event.target.getBoundingClientRect().bottom - frame.getBoundingClientRect().top;
      reveal({ index, offset: Math.max(0, bottom - innerHeight + 24) });
    } else {
      if (frame) select();
      boundNativeScroll();
    }
  });
  document.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') interrupt(event); });
  const restoreNavigation = () => {
    clearTimeout(boundaryTimer);
    cancel();
    select();
    nativeNavigation = true;
    releaseBoundary();
    requestAnimationFrame(() => {
      const target = fragmentTarget();
      if (beyondBoundary(target)) {
        target?.scrollIntoView({ block: 'start', behavior: 'instant' });
        nativeNavigation = false;
        rememberPosition();
      } else boundNativeScroll();
    });
  };
  window.addEventListener('hashchange', restoreNavigation);
  window.addEventListener('popstate', restoreNavigation);
  window.addEventListener('pagehide', () => { activeTouches = 0; scrollInProgress = false; cancel(); select(); releaseBoundary(); });
  window.addEventListener('pageshow', event => requestAnimationFrame(() => {
    if (event.persisted || restoringHistory || !beyondBoundary(fragmentTarget())) boundNativeScroll();
    rememberPosition();
  }));
  window.addEventListener('scroll', () => {
    clearTimeout(boundaryTimer);
    scrollPending = true;
    scrollInProgress = true;
    updateTouchAction();
    if (!supportsScrollEnd) scheduleScrollSettlement();
  }, { passive: true });
  document.addEventListener('scrollend', event => {
    if (event.target !== document) return;
    scrollInProgress = false;
    settleScroll();
  });
  const resize = () => {
    clearTimeout(boundaryTimer);
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (zoomed()) return;
      const stop = destination ?? (!activeTouches && !scrollInProgress ? selected : undefined);
      if (destination) cancel();
      if (stop) reveal(stop);
      if (boundaryEnabled || stop) boundNativeScroll();
      updateTouchAction();
      if (!supportsScrollEnd || !scrollInProgress) scheduleScrollSettlement();
    });
  };
  window.addEventListener('resize', resize);
  let wasZoomed = zoomed();
  root.classList.toggle('is-frame-zoomed', wasZoomed);
  window.visualViewport?.addEventListener('resize', () => {
    const isZoomed = zoomed();
    root.classList.toggle('is-frame-zoomed', isZoomed);
    if (isZoomed) { cancel(); select(); releaseBoundary(); }
    // Initial viewport sizing must not cap a pending direct fragment visit.
    else {
      if (wasZoomed) { rememberPosition(); boundNativeScroll(); }
      resize();
    }
    wasZoomed = isZoomed;
  });
  reducedMotion.addEventListener('change', () => {
    const stop = destination;
    const pending = scrollPending;
    cancel();
    if (stop) reveal(stop);
    else { scrollPending = pending; if (!supportsScrollEnd || !scrollInProgress) scheduleScrollSettlement(); }
    boundNativeScroll();
  });
  const restoringHistory = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'back_forward';
  if (!restoringHistory && !beyondBoundary(fragmentTarget())) boundNativeScroll();
  updateTouchAction();
  const layoutObserver = new ResizeObserver(() => {
    if (boundaryEnabled || selected || destination) resize();
  });
  frames.forEach(frame => layoutObserver.observe(frame));
  document.fonts.ready.then(() => { if (boundaryEnabled) boundNativeScroll(); rememberPosition(); });
}
