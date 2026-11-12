# Travel agency landing

Mobile-first Argentine virtual travel agency website. Built with Astro 7.4.5, TypeScript and native CSS. Astro generates static HTML; browser JavaScript handles the menu, destination card changes, regional return links, contact destination context and solar lighting. Horizontal gestures replace destination cards in a stationary slot.

## Run locally

Use Node.js 24.x. The project pins Node 24.22.2 and npm 10.9.8 through Volta, if installed. The Node major version is also declared in `engines` so Vercel uses the tested major version.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Astro, normally `http://127.0.0.1:4321/`. Development and preview bind to `127.0.0.1` by default, so they accept connections only from the same machine.

```sh
npm run check
npm test
npm run build
npm run test:security
npm run preview
```

`check` runs Astro's type diagnostics. `test` runs the solar tests. `build` generates `dist/`. Run `test:security` after building to check the generated pages and their browser policies. `preview` serves that production build on loopback and does not enable development phase previews.

For an explicit phone review on a trusted local network, use one of these commands:

```sh
npm run dev:lan
npm run preview:lan
```

The LAN commands listen on `0.0.0.0`. Connect both devices to the same trusted network and open the Network URL printed by Astro. Reachable network peers may access the running server; the computer's firewall must allow the connection. This project does not change firewall settings. Stop the server after the review.

## Review the site

| URL | Content |
| --- | --- |
| `/` | Window hero, agency section and destination explorer |
| `/#agencia` | Agency introduction |
| `/agencia/` | Agency presentation and pending team information |
| `/destinos/` | Three regions with destination cards that change in place |
| `/?region=asia#destinos` | Asia: Japan, Thailand, Vietnam and Indonesia |
| `/?region=europa#destinos` | Europe, Portugal and Italy |
| `/?region=america#destinos` | America, Peru and Mexico |
| `/destinos/japon/` | Reusable destination template: Japan |
| `/destinos/portugal/` | Reusable destination template: Portugal |
| `/destinos/italia/` | Reusable destination template: Italy |
| `/contacto/?destino=japon` | Contact with Japan retained as the inquiry destination |

The other valid contact destination values are `tailandia`, `vietnam`, `indonesia`, `portugal`, `italia`, `peru` and `mexico`. Each destination has a static page under `/destinos/<slug>/`, links back to its region and retains its selection in contact. Itineraries are illustrative, not bookable packages. The contact page displays a pending Instagram channel and collects no personal data. Only known destination slugs are shown, using text content. Unknown queries are ignored. Without JavaScript, navigation and destination content remain available; query-based contact context requires JavaScript.

### Responsive layout

The phone composition is preserved below 760 px. Tablet and desktop rules start at 760 px, with shared gutters and a content width capped at 1184 px. Region panels place their title and description beside a larger stationary destination card. Agency and contact content use two columns; destination covers and itinerary details split at 1024 px. Short landscape screens use compact spacing and allow taller content to remain scrollable. The window keeps its full frame and fixed wing, with its size limited by viewport height.

### Window lighting

In development, use the phase selector or these URLs:

| URL | Preview |
| --- | --- |
| `/?fase=amanecer` | Dawn |
| `/?fase=dia` | Day |
| `/?fase=atardecer` | Sunset |
| `/?fase=noche` | Night |
| `/` or `/?fase=auto` | Automatic |

Production ignores `fase`. Automatic mode uses SunCalc 2.1.1 solar position at the current absolute instant and fixed Buenos Aires coordinates (`-34.60, -58.38`), independent of the phone's configured time zone. It interpolates lighting, refreshes when the page opens or returns to view, and updates every three minutes while visible. See [the solar API](https://github.com/mourner/suncalc).

The window is a flattened provisional image. Only the window interior changes light; the wing and cabin remain still. Reduced-motion preferences disable visual transitions. With JavaScript disabled, the hero retains a stable daytime image and a working destinations link. See [design and verification notes](docs/review-notes.md) for asset provenance and the layered export needed before adding cloud movement.

## Edit content

- `src/config/agency.ts`: agency name, description, team, mission, history and confirmed contact URLs.
- `src/data/destinations.ts`: typed regions, destination copy, images and itinerary stops.
- `src/pages/destinos/[slug].astro`: shared destination template and generated static routes.
- `src/assets/`: source images optimized by Astro during the build.
- `public/fonts/`: local Montserrat and Instrument Sans variable fonts with their OFL licenses; no runtime font provider requests.

Leave unconfirmed channels unset. Replace the placeholder identity and institutional copy only with approved material. Asset sources and review criteria are in [docs/review-notes.md](docs/review-notes.md).

## Public repository and browser security

Treat all tracked source, documentation and asset metadata as public. Keep credentials, personal project correspondence, private design links and local environment details outside version control. Ignore rules do not remove material from existing commits. `private: true` in `package.json` prevents npm publication; it does not make the GitHub repository private.

Production builds include a Content Security Policy, and pages use a `no-referrer` policy. Review browser console output and the contact flow after changes to scripts, styles or resource origins. Build-time page policies do not replace hosting-level HTTP protections, including restrictions on framing.

The site includes `noindex` for draft review. This is a search-engine instruction, not access control. Any confidential preview needs hosting-level access protection. This delivery does not include a CMS, user accounts, reservations, payments, deployment or Vercel administration.
