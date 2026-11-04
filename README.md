# Travel agency landing

Internal, mobile-first review of an Argentine virtual travel agency website. Built with Astro 7.4.5, TypeScript and native CSS. Astro generates static HTML; browser JavaScript handles navigation, region selection, the contact preview and solar lighting.

## Run locally

Use Node.js 24.x. The project pins Node 24.22.2 and npm 10.9.8 through Volta, if installed. The Node major version is also declared in `engines` so Vercel uses the tested major version.

```sh
npm install
npm run dev
```

Open the Local URL printed by Astro, normally `http://localhost:4321/`. The development command listens on `0.0.0.0`. To review on a phone, connect both devices to the same Wi-Fi and open the printed Network URL, or `http://<computer-LAN-IP>:4321/`. Use the computer's LAN IPv4 address rather than `localhost` on the phone. The computer's firewall must allow the connection; this project does not change firewall settings.

```sh
npm run check
npm test
npm run build
npm run preview
```

`check` runs Astro's type diagnostics. `test` runs the injected-date solar tests. `build` generates `dist/`. `preview` serves that production build on the local network and does not enable development phase previews.

## Review the site

| URL | Content |
| --- | --- |
| `/` | Window hero, agency section and destination explorer |
| `/#agencia` | Agency introduction |
| `/?region=asia#destinos` | Asia and Japan |
| `/?region=europa#destinos` | Europe, Portugal and Italy |
| `/destinos/japon/` | Reusable destination template: Japan |
| `/destinos/portugal/` | Reusable destination template: Portugal |
| `/destinos/italia/` | Reusable destination template: Italy |
| `/contacto/?destino=japon` | Contact preview with Japan selected |

The other valid contact destination values are `portugal` and `italia`. Each destination links back to its region and into contact with its destination selected. Itineraries are illustrative, not bookable packages. Contact currently supports local review of the fields; no recipient or submission service is configured.

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

The Figma window is a flattened provisional image. Only the window interior changes light; the wing and cabin remain still. Reduced-motion preferences disable visual transitions. With JavaScript disabled, the hero retains a stable daytime image and a working destinations link. See [review notes](docs/review-notes.md) for the layered export needed before adding cloud movement.

## Edit content

- `src/config/agency.ts`: agency name, description, team, mission, history and confirmed contact URLs.
- `src/data/destinations.ts`: typed regions, destination copy, images and itinerary stops.
- `src/pages/destinos/[slug].astro`: shared destination template and generated static routes.
- `src/assets/`: source images optimized by Astro during the build.

Leave unconfirmed channels unset. Replace the placeholder identity and institutional copy only with approved material. The remaining design and commercial decisions, asset sources and review criteria are in [docs/review-notes.md](docs/review-notes.md).

The site includes `noindex` for internal review. This is a search-engine instruction, not access control. This delivery does not include a CMS, user accounts, reservations, payments, deployment or Vercel administration.
