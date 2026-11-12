# Design and verification notes

## Layout

Preserve the approved mobile hierarchy while adapting each screen to the available width and visible viewport height (`100dvh`, with `100svh` fallback). The desktop layout retains the hierarchy, complete window frame, wing and readable HTML text. Private design references and project discussions are managed outside the public repository.

The home hero and Quienes somos use the stable small viewport height (`100svh`) to avoid layout shifts when mobile browser controls appear or disappear. Quienes somos bases its image height, padding and gaps on the same stable height; its minimum height still allows longer content to expand the section.

The home page keeps every section in one document. Inicio and Quienes somos use conventional scrolling, including the gesture entering Asia and the return to Quienes somos. Asia marks the native-scroll boundary: wheel and touch momentum stop at its bottom edge, and a new gesture is required to continue to Europa. When a native gesture finishes inside destinations, the page aligns the current region after touch and wheel momentum end. Gestures ending in a native section retain their position, and tall regions preserve their reading offset. The agency page also uses native scrolling throughout. Within destinations, Asia, Europa, America and Contacto retain one-screen transitions per gesture. Web Animations handles opacity and blur without an animation library or document snapshots.

Each region shows one destination card in a stationary slot. The card grid uses a bounded track so portrait images cannot expand it and clip the route or open button. Horizontal touch gestures, trackpad scrolling and Shift+wheel replace the card with a short opacity fade; vertical gestures continue through the page. A gesture advances at most one card and stops at the first or last card. A compact country selector below the card provides direct selection, with an underline and pressed state for the active country. Left/Right, Home and End keys also change destinations; within the selector they move focus to the chosen country. A live status announces the destination and its position, and only the active card is exposed to keyboard and assistive technology. Reduced motion changes cards immediately. Without JavaScript, all cards remain available in a native horizontal list.

The region background uses the active destination's photograph and shares the card's fade. Uncached photos finish loading before the card and background switch. The first destination supplies the initial background, and the menu captures the active photograph. Without JavaScript, the background stays on the first destination while all cards remain accessible.

A controlled change from a partially visible region uses continuous scrolling until the next frame; blur requires the outgoing frame to cover the viewport so it cannot expose an empty strip. Resizing during a controlled transition settles its destination against the new viewport height.

The home footer's return-to-start link crossfades directly to the hero without scrolling past the intermediate regions. Any adjacent visible frame joins the outgoing fade when the footer is partially visible. It retains its native fragment link as a fallback, respects modified clicks, and returns keyboard focus to the main content after completion. Reduced motion makes this return immediate.

Further movement from the same controlled gesture is consumed, including momentum after the transition ends. New gestures during a transition are not queued. A native gesture releases the selected screen so it cannot pull the page back to a destination. Directional touch permissions follow the current scroll position before the next gesture, allowing native entry and return even when a destination is partially visible. Card gestures do not advance regions, while pinch zoom and menu scrolling retain their native behavior. Keyboard scrolling, Tab, direct links and history can reach the full document. Reduced motion makes frame changes immediate. Cancelling a transition clears its effects and invalidates pending callbacks so links, focus and history remain in control. Without JavaScript, the complete document remains available through native scrolling and links.

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
- On Quienes somos, show and hide the mobile browser controls and check that the image, text, button and start of Asia keep their document positions. Repeat on a short phone and after rotation; the section must expand when its content needs more space.
- From home, wheel and touch gestures must move freely between Quienes somos and Asia in both directions. A large gesture and its continued momentum must stop at Asia without exposing Europa; a new gesture must advance to Europa. End a gesture partway into Asia: once released and stationary, Asia must align without leaving Europa visible below. Hold the finger still before release, reverse toward Quienes somos, and change cards afterward; alignment must wait for release and must not pull a native exit back into Asia. Repeat without native scrollend support. Check native scrolling throughout the agency page and one-screen transitions between destinations separately.
- Change cards with horizontal wheel, Shift+wheel, touch, the country selector and keyboard. Check all eight cards for complete titles, routes and open buttons, including Italy after Portugal. Check stationary placement, one change per gesture, reverse direction, first/last limits, selected country state, visible focus and destination links. Vertical gestures over a card must still navigate the page; horizontal gestures and their momentum must not advance regions.
- Repeat at 1440 px, narrow/short phone sizes and landscape; check viewport resizing, screen stops, header contrast and the first transition with its fixed background and moving content. Check that long screens remain readable through their last link.
- Review all three regions and eight destination pages, menu open/close, contact context and the pending channel message.
- Check for browser errors or Content Security Policy violations. Confirm unrecognized destination queries are ignored, text is displayed literally and no contact data is submitted.
- Repeat navigation with the keyboard, including visible focus, menu focus behavior and Escape.
- Compare the four development lighting presets and automatic mode; confirm production ignores the preset parameter.
- Review the full window frame and wing at mobile and desktop sizes, without stretching or losing the frame to cropping.
- Review with JavaScript disabled and with reduced motion enabled.
- Review on an actual phone through an explicit LAN command on a trusted network when available; a browser mobile viewport alone does not establish device testing.
