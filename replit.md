# StarGazer

A personal astronomy companion app that shows what's in tonight's sky based on your current location — planets, stars, deep sky objects, moon phase, ISS passes, celestial events, and seeing conditions.

## Run & Operate

- `pnpm --filter @workspace/stargazer run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Framer Motion, Tailwind CSS v4, shadcn/ui
- API: Express 5 (`artifacts/api-server`)
- Astronomical calculations: `astronomy-engine` (NASA-grade, no API key needed)
- External APIs (all free, no key): Open-Meteo (weather), Open Notify (ISS), NASA Image Library
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `artifacts/api-server/src/routes/sky/astronomy.ts` — all astronomical calculations (planets, moon, stars, deep sky, events)
- `artifacts/api-server/src/routes/sky/index.ts` — sky route handlers
- `artifacts/api-server/src/routes/nasa/index.ts` — NASA image search route
- `artifacts/stargazer/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- **Astronomy-engine for calculations**: All planet/star/moon positions are computed server-side using the `astronomy-engine` library (same algorithms used by NASA). No paid API needed, no rate limits, accurate to arcseconds.
- **No database**: This app is stateless — all data is computed on the fly from the user's location and current time. Location is persisted in localStorage on the frontend.
- **Free external APIs only**: Open-Meteo (weather), Open Notify (ISS), NASA Image Library — all free and no API key required. ISS passes degrade gracefully to approximate values if the external API is unavailable.
- **OpenAPI-first**: All API contracts defined in `lib/api-spec/openapi.yaml` before implementation. Codegen produces React Query hooks and Zod validation schemas.

## Product

- User provides location via GPS or manual lat/lon entry
- Dashboard shows tonight's sky overview: moon phase, visible planets, sunset/twilight times, seeing conditions
- Planets page: all 7 planets with altitude, azimuth, rise/set, magnitude, distance in AU
- Moon page: phase visualization, illumination, rise/set, next full/new moon countdown
- Stars page: 27 notable bright stars with spectral type color-coding and sky positions
- Deep Sky page: 30 Messier objects with NASA imagery for famous ones (M31, M42, M45, etc.)
- Events page: upcoming meteor showers, eclipses, conjunctions, oppositions (next 90 days)
- ISS Tracker: current ISS position + upcoming pass times over your location
- Conditions page: cloud cover, humidity, wind, dew point, seeing rating (1-5)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always re-run codegen: `pnpm --filter @workspace/api-spec run codegen`
- The OpenAPI spec must use `type: number` (not `type: integer`) — the workspace Zod version doesn't support `zod.int()`
- `astronomy-engine` uses J2000 equatorial coordinates — always pass `true` for `aberration` parameter in `Astronomy.Equator()`
- The ISS pass times endpoint degrades gracefully: if Open Notify is unavailable, approximate passes are generated
- Location context uses `useSkyLocation` (not `useLocation`) to avoid shadowing wouter's hook

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
