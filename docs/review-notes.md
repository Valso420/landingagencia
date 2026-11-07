# Design and verification notes

## Layout

Preserve the approved mobile hierarchy while adapting each screen to the available width and visible viewport height (`100dvh`, with `100svh` fallback). The desktop layout retains the hierarchy, complete window frame, wing and readable HTML text. Private design references and project discussions are managed outside the public repository.

The home page keeps every section in one document. Inicio and Quienes somos use conventional scrolling without vertical snapping. While scrolling that native portion, a temporary overflow clip limits the document to the end of Quienes somos, so touch inertia and wheel momentum cannot expose part of Asia. A new downward gesture at that boundary releases the limit and starts the 800 ms transition to Asia. Asia, Europa, America and Contacto then advance one screen per gesture. Returning from Asia to Quienes somos restores the native limit after the transition. Web Animations handles opacity and blur without an animation library or document snapshots.

A controlled change from a partially visible region uses continuous scrolling until the next frame; blur requires the outgoing frame to cover the viewport so it cannot expose an empty strip. The native limit follows viewport and font changes. Resizing during a controlled transition settles its destination against the new viewport height.

The home footer's return-to-start link crossfades directly to the hero without scrolling past the intermediate regions. Any adjacent visible frame joins the outgoing fade when the footer is partially visible. It retains its native fragment link as a fallback, respects modified clicks, and returns keyboard focus to the main content after completion. Reduced motion makes this return immediate.

Further movement from the same gesture is consumed, including momentum after the transition ends. New gestures during a transition are not queued. Horizontal carousels, pinch zoom and menu scrolling retain their native behavior. On home, Arrow, Page and Space keys follow the same screen stops; Tab, Home, End, direct links and history can reach the full document. Other pages retain native keyboard scrolling. Reduced motion makes frame changes immediate. Cancelling a transition clears its effects and invalidates pending callbacks so links, focus and history remain in control. Without JavaScript, the complete document remains available through native scrolling and links.

Opening the menu during a frame transition immediately settles the selected frame before capturing the menu background and locking scroll. A background touch begun while the menu closes remains consumed until the finger lifts, so unlocking cannot turn that gesture into free scrolling. Wheel momentum from the locked menu is also consumed until the next distinct gesture; scrolling inside the open menu remains native.

Viewport scales within 1% of the default zoom are treated as unzoomed to tolerate mobile rounding. Larger zoom levels retain native panning instead of frame navigation.

Long itineraries, enlarged text and very short viewports can expand a screen so content remains accessible. Gestures move through that content before advancing to the next frame; do not clip text to force a fixed height.

The transparent navigation stays fixed over the screens and switches foreground color for light backgrounds. Its open menu background stays at 22% opacity. The window fallback shares the hero's solar lighting, including on direct visits to other pages. Hero and menu CTAs use the same bottom inset and maximum width. Their white pill backgrounds remain opaque within each surface; only the menu CTA label joins the content fade. The menu surface therefore composites white over the hero's white pill during opening, closing and reversals. Flexible spacing adapts to viewport height; short screens retain a scrollable menu surface and keyboard focus handling. Without JavaScript, navigation remains visible in normal flow. During the first transition, the window background and its lighting stay fixed while the title and destination button move upward with the screen. The hero clips its background as the next opaque screen covers it. Reduced motion and the no-JavaScript fallback keep the background attached to the hero; solar lighting is preserved.

The menu opens and closes with sequential opacity fades over the stationary background. Opening fully covers the page content before revealing the menu text and buttons; closing hides the menu content before revealing the page. Repeated toggles reverse from the current opacity while preserving this separation. Background scrolling stays locked until closing finishes, and closing links leave the focus order immediately. Native navigation and reduced motion complete the state change without waiting for animation.

On region panels, destination covers and the contact screen, the menu keeps the active screen's photograph and crop at the same 22% opacity. Background images opt in with `data-menu-background`; inline photographs and cards do not replace the window fallback on solid screens.

## Window and requested exports

The supplied window asset is a provisional AI-generated image with the frame, wing, sky and clouds flattened together. Moving that photograph would move the cabin or duplicate the wing. This version keeps the image still and applies solar lighting through an aligned interior mask. No decorative cloud animation or pause control is needed for this static image. Reduced-motion preferences retain the current light and remove transitions.

Cloud movement requires these aligned layers:

1. A foreground containing the cabin/window frame and wing, with transparency through the exterior area.
2. A clean background containing only sky and clouds, with no wing or cabin.

Both exports must use the same canvas dimensions, crop, scale and alignment as the current composition. Cloud motion must remain behind the foreground. A future looping animation needs a discreet pause control and must stop for reduced motion.

## Asset provenance

Assets are stored locally. The supplied design identifies these editorial photo sources:

| Asset | Original source |
| --- | --- |
| Kyoto / Japan | [Unsplash photo-1493976040374-85c8e12f0c0e](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e) |
| Porto / Portugal | [Unsplash photo-1555881400-74d7acaacd8b](https://images.unsplash.com/photo-1555881400-74d7acaacd8b) |
| Cinque Terre / Italy | [Unsplash photo-1516483638261-f4dbaf036963](https://images.unsplash.com/photo-1516483638261-f4dbaf036963) |
| Airplane window | Provisional AI-generated image supplied with the design; no separate source or layers confirmed |

Montserrat and Instrument Sans are served locally from `public/fonts/`, including Latin and extended Latin subsets and their OFL licenses. The new travel-planning, Thailand, Vietnam, Indonesia, Peru and Mexico photos are supplied editorial images; additional original-source attribution was not provided. Confirm permission to use supplied/generated assets and retain required credits and legitimate provenance. Source URLs identify the design's references; they do not constitute a rights review. Inspect new assets for private metadata before committing them.

## Content scope

`src/config/agency.ts` centralizes agency information and optional channel URLs. `src/data/destinations.ts` centralizes typed editorial content. Unconfirmed channels remain unset, and external contact links should only be enabled with real, approved URLs. Do not add unapproved prices, testimonials, registration numbers or authorization claims.

## Contact behavior and scope

Destination inquiry links open `/contacto/?destino=<slug>`. Contact displays the chosen destination and a return link using a catalogue whitelist. The Instagram URL remains unset and is explicitly marked pending. There is no form, personal-data collection, submission or delivery confirmation. The menu and home contact CTA lead to this page while the channel is unconfirmed. Query-based context requires JavaScript; all destination pages and native navigation remain available without it.

No CMS, user accounts, reservations, payments or Vercel administration is part of this delivery. `noindex` helps keep a draft out of search results; it does not protect access to a hosted copy or public repository contents.

## Verification checklist

- Run `npm run check`, `npm test`, `npm run build` and then `npm run test:security`.
- At 390 px, follow home to continent to destination to inquiry; confirm the destination is retained and the regional return link works.
- From home, a long wheel burst or touch swipe must stop before Asia; a fresh gesture advances exactly one screen. Check the return from Asia to the native portion and the horizontal card carousel separately.
- Repeat at 1440 px, narrow/short phone sizes and landscape; check viewport resizing, screen stops, header contrast and the first transition with its fixed background and moving content. Check that long screens remain readable through their last link.
- Review all three regions and eight destination pages, menu open/close, contact context and the pending channel message.
- Check for browser errors or Content Security Policy violations. Confirm unrecognized destination queries are ignored, text is displayed literally and no contact data is submitted.
- Repeat navigation with the keyboard, including visible focus, menu focus behavior and Escape.
- Compare the four development lighting presets and automatic mode; confirm production ignores the preset parameter.
- Review the full window frame and wing at mobile and desktop sizes, without stretching or losing the frame to cropping.
- Review with JavaScript disabled and with reduced motion enabled.
- Review on an actual phone through an explicit LAN command on a trusted network when available; a browser mobile viewport alone does not establish device testing.
