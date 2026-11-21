# Travel agency landing

Mobile-first Argentine virtual travel agency website. Built with Astro 7.4.5, TypeScript and native CSS. Astro generates static HTML. Browser JavaScript handles the menu, mobile destination card changes, regional return links, contact destination context and solar lighting. Horizontal gestures replace mobile destination cards in a stationary slot, and desktop displays the cards in a grid.

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

`check` runs Astro's type diagnostics. `test` runs the solar and frame-navigation tests. `build` generates `dist/`. Run `test:security` after building to check the generated pages and their browser policies. `preview` serves that production build on loopback and does not enable development phase previews.

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
| `/agencia/` | Compatibility redirect to `/#agencia`, including without JavaScript |
| `/destinos/` | Seven categories containing sixteen editorial destination pages |
| `/?region=argentina#destinos` | Argentina: Patagonia and Iguazú |
| `/?region=exoticos#destinos` | Exóticos: Japan, Thailand, Vietnam and Indonesia |
| `/?region=europa#destinos` | Europe, Portugal and Italy |
| `/?region=resto-america#destinos` | Resto de América: Peru and Mexico |
| `/destinos/japon/` | Reusable destination template: Japan |
| `/destinos/portugal/` | Reusable destination template: Portugal |
| `/destinos/italia/` | Reusable destination template: Italy |
| `/contacto/?categoria=argentina` | Category inquiry with a return link to Argentina |
| `/contacto/?destino=japon` | Contact with Japan retained as the inquiry destination |
| `/destinos/iguazu/?origen=inicio` | Iguazú with a return to its category on home |
| `/?seleccion=iguazu#region-argentina` | Home with Iguazú restored in Argentina |

The sixteen valid contact destination values are `patagonia`, `iguazu`, `rio-de-janeiro`, `florianopolis`, `nueva-york`, `miami`, `punta-cana`, `cancun`, `japon`, `tailandia`, `vietnam`, `indonesia`, `portugal`, `italia`, `peru` and `mexico`. Each destination has a static page under `/destinos/<slug>/`, containing a brief summary or an illustrative itinerary. All seven categories have examples and a contextual inquiry link. The contact page shows confirmed contact details when available and collects no personal data. Only known destinations and categories are displayed, using text content. Unknown queries are ignored. Without JavaScript, navigation and destination content remain available. Query-based contact context requires JavaScript.

The `origen` query parameter preserves whether a destination was opened from `inicio` or `destinos`, including the return from contact. Missing or unknown origins default to `destinos`. Regional return links include `seleccion=<slug>` and a `#region-<slug>` fragment so the originating explorer restores the chosen mobile card and category.

### Responsive layout

The phone composition is preserved below 760 px, with one active destination card and a direct selector for each category. From 760 px, categories display every card in a two-column grid, with their title and description above it. Exóticos uses four columns from 1200 px. The home introduction and contact use two columns from 760 px. Desktop navigation and split destination covers appear from 1024 px. The home introduction uses a 1280 px maximum content width and a 640 px section at the reference desktop size. The shared desktop consultation footer is 490 px tall, and Destinos retains its preceding inquiry CTA. Short landscape screens use compact spacing and allow taller content to remain scrollable. The window keeps its full frame and fixed wing, with its size limited by viewport height.

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

- `src/pages/index.astro`: the approved three-paragraph agency introduction immediately after the window hero.
- `src/config/agency.ts`: agency name, description and confirmed contact details.
- `src/data/destinations.ts`: typed regions, destination copy, images and itinerary stops.
- `src/pages/destinos/[slug].astro`: shared destination template and generated static routes.
- `src/assets/`: source images optimized by Astro during the build.
- `public/fonts/`: local Montserrat and Instrument Sans variable fonts with their OFL licenses; no runtime font provider requests.

Leave unconfirmed channels unset. Replace the placeholder identity and institutional copy only with approved material. Asset sources and review criteria are in [docs/review-notes.md](docs/review-notes.md).

## Public repository and browser security

Treat all tracked source, documentation and asset metadata as public. Keep credentials, personal project correspondence, private design links and local environment details outside version control. Ignore rules do not remove material from existing commits. `private: true` in `package.json` prevents npm publication; it does not make the GitHub repository private.

Production builds include a Content Security Policy, and pages use a `no-referrer` policy. Review browser console output and the contact flow after changes to scripts, styles or resource origins. Build-time page policies do not replace hosting-level HTTP protections, including restrictions on framing.

The site includes `noindex` for draft review. This is a search-engine instruction, not access control. Any confidential preview needs hosting-level access protection. This delivery does not include a CMS, user accounts, reservations, payments, deployment or Vercel administration.
