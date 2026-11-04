# Internal review notes

## Design references

The 390 px mobile flow is the primary reference. The extended landing is a composition reference, not a desktop specification. The desktop layout is provisional and should preserve the complete window frame, wing and readable HTML text.

- [Mobile flow, node 2-10](https://www.figma.com/design/Fvt0aZFeIWokaF4tkbGJUu?node-id=2-10)
- [Extended landing, node 3-2](https://www.figma.com/design/Fvt0aZFeIWokaF4tkbGJUu?node-id=3-2)
- [Window, node 15-2](https://www.figma.com/design/Fvt0aZFeIWokaF4tkbGJUu?node-id=15-2)
- [References and pending content, node 3-63](https://www.figma.com/design/Fvt0aZFeIWokaF4tkbGJUu?node-id=3-63)

The supplied goal-objective file ends mid-sentence after "Revisa". The explicit typecheck, build and browser-flow requirements before that cutoff remain the verification scope; no missing text has been inferred as an additional requirement.

## Window and requested exports

The supplied window asset is a provisional generated image with the frame, wing, sky and clouds flattened together. Moving that photograph would move the cabin or duplicate the wing. This version keeps the image still and applies solar lighting through an aligned interior mask. No decorative cloud animation or pause control is needed for this static image. Reduced-motion preferences retain the current light and remove transitions.

Valentina should export these aligned layers before cloud movement is added:

1. A foreground containing the cabin/window frame and wing, with transparency through the exterior area.
2. A clean background containing only sky and clouds, with no wing or cabin.

Both exports must use the same canvas dimensions, crop, scale and alignment as the current composition. Cloud motion must remain behind the foreground. A future looping animation needs a discreet pause control and must stop for reduced motion.

## Asset provenance

Assets were supplied by the Figma design and stored locally. The design identifies these editorial photo sources:

| Asset | Original source |
| --- | --- |
| Kyoto / Japan | [Unsplash photo-1493976040374-85c8e12f0c0e](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e) |
| Porto / Portugal | [Unsplash photo-1555881400-74d7acaacd8b](https://images.unsplash.com/photo-1555881400-74d7acaacd8b) |
| Cinque Terre / Italy | [Unsplash photo-1516483638261-f4dbaf036963](https://images.unsplash.com/photo-1516483638261-f4dbaf036963) |
| Airplane window | Provisional generated image supplied in Figma; no separate source or layers confirmed |

The typeface is DM Sans, served locally through `@fontsource-variable/dm-sans`. Confirm final image selections and permission to use all supplied/generated assets before public release. Source URLs identify the design's references; they do not constitute a rights review.

## Decisions for Sonia, Federico and Valentina

- Confirm the final agency name, identity and visual assets.
- Approve the introduction, mission and team history. Current institutional copy includes explicit placeholders.
- Confirm the destination catalogue and itinerary text. Japan, Portugal and Italy are illustrative examples.
- Confirm the form's recipient and submission channel, WhatsApp and Instagram URLs, and any institutional links.
- Resolve the difference between the design's Instagram direction and the budgeted form plus WhatsApp. This review routes inquiries through the local contact form.
- Confirm image permissions and any required credits.

`src/config/agency.ts` centralizes agency information and optional channel URLs. `src/data/destinations.ts` centralizes typed editorial content. Unconfirmed channels remain unset, and external contact links should only be enabled with real, approved URLs. Do not add unapproved prices, testimonials, registration numbers or authorization claims.

## Contact behavior and scope

Destination inquiry links open `/contacto/?destino=<slug>`. The contact form includes destination, dates and passenger count for local review. With no confirmed recipient or submission integration, the form must clearly state that sending is pending and must not imply a message was delivered. It does not create a reservation or payment.

No CMS, user accounts, reservations, payments or Vercel administration is part of this delivery. `noindex` helps keep an internal draft out of search results; it does not protect access to a hosted copy.

## Verification checklist

- Run `npm run check`, `npm test` and `npm run build`.
- At 390 px, follow home to continent to destination to inquiry; confirm the destination is retained and the regional return link works.
- Review both continents, all three destination pages, menu open/close, contact validation and the local submission message.
- Repeat navigation with the keyboard, including visible focus, menu focus behavior and Escape.
- Compare the four development lighting presets and automatic mode; confirm production ignores the preset parameter.
- Review the full window frame and wing at mobile and desktop sizes, without stretching or losing the frame to cropping.
- Review with JavaScript disabled and with reduced motion enabled.
- Review on an actual phone through the same Wi-Fi network when available; a browser mobile viewport alone does not establish device testing.

## Recorded verification (2026-11-04)

- `npm run check`: zero errors, warnings or hints.
- `npm test`: seven passing tests, including all four injected-date phases, seasonal variation, continuity across 1,440 minutes, time-zone independence and production overrides disabled.
- `npm run build`: five static HTML pages and local optimized WebP images generated successfully.
- Browser flow passed for Japan, Portugal and Italy, including region return, preselected contact destination, invalid return-date rejection and local summary. No message was sent.
- Keyboard navigation passed: menu open, focus movement, Tab wrapping, Escape restoration, destination and inquiry links.
- At 320, 390 and 1440 px, the checked home, destination and contact pages had no document overflow or broken visible images. The 390 px window composition was compared with Figma; the desktop frame and wing remain visible without stretching.
- The four development lighting presets were reviewed visually. Reduced motion preserves the lighting and sets transitions to zero. With page JavaScript disabled, the daytime photo loads, both regions remain accessible and the hero destination link works with Enter.
- Production preview ignores `?fase=dia` and `?fase=atardecer`, keeps the actual automatic night phase at the checked instant, and omits the development selector.
- Browser checks reported no application console errors. An actual phone and its Wi-Fi/firewall path were not available for testing; use the Network URL printed by the development server for that final device review.
