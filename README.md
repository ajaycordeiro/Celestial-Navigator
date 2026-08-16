# 🔭 StarGazer

A full-featured astronomy web app for planning and enjoying nights under the stars. StarGazer combines real-time celestial calculations with live weather data to tell you exactly what's visible from your location — tonight.

---

## Features

| Tab | What it does |
|---|---|
| **Dashboard** | At-a-glance sky conditions, planet highlights, and quick links to every tool |
| **Sky Map** | Interactive 2D map of the sky overhead, updated in real time |
| **Planets** | Rise/transit/set times, angular size, magnitude, and current constellation for all planets |
| **Moon** | Phase, illumination, rise/set, distance, angular diameter, and next major phase dates |
| **Stars** | Curated bright-star atlas with altitude, azimuth, magnitude, spectral type, and distance |
| **Deep Sky** | Messier and NGC objects with visibility ratings, angular size, and observing notes |
| **ISS Tracker** | Next passes over your location with max elevation and pass duration |
| **Conditions** | Cloud cover, seeing index, transparency, wind, humidity, and an overall sky-quality verdict |
| **Analemma** | Sun's figure-8 path across the sky at a chosen hour, with a layman explainer |

---

## Tech Stack

### Frontend (`artifacts/stargazer`)
- **React 19** + **TypeScript** via **Vite**
- **Tailwind CSS** + **shadcn/ui** components
- **Recharts** for data visualisation
- **Wouter** for client-side routing
- **TanStack Query** for server state / caching
- **Framer Motion** for animations
- **Lucide React** icons

### API Server (`artifacts/api-server`)
- **Node.js** + **Fastify** (via Express router)
- **astronomy-engine** for all celestial calculations (rise/set, altitude, azimuth, phases, illumination)
- **Open-Meteo** for free weather and seeing data
- **esbuild** for fast production builds

### Shared Libraries
| Package | Purpose |
|---|---|
| `lib/api-spec` | OpenAPI 3.1 spec — single source of truth for all endpoints |
| `lib/api-zod` | Zod schemas auto-generated from the spec (server-side validation) |
| `lib/api-client-react` | Typed fetch client + TanStack Query hooks (generated from spec) |

### Monorepo
- **pnpm workspaces** with TypeScript project references
- Managed by **Replit** (workflows, port routing, secrets)

---

## Project Structure

```
.
├── artifacts/
│   ├── stargazer/          # React frontend
│   │   └── src/
│   │       ├── pages/      # One file per tab
│   │       ├── components/ # Shared UI components
│   │       └── lib/        # Utilities, hooks, context
│   └── api-server/         # Express API
│       └── src/
│           └── routes/sky/ # All astronomy + weather routes
├── lib/
│   ├── api-spec/           # openapi.yaml
│   ├── api-zod/            # Generated Zod schemas
│   └── api-client-react/   # Generated fetch client & hooks
└── package.json            # Workspace root
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Install & run

```bash
# Install all workspace dependencies
pnpm install

# Start the API server (port set by $PORT env var, default 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend dev server (separate terminal)
pnpm --filter @workspace/stargazer run dev
```

Open `http://localhost:5173` (or whichever port Vite picks) in your browser.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API server port (default `8080`) |
| `SESSION_SECRET` | Yes (prod) | Secret for session signing |

No API keys are required — weather data comes from the free [Open-Meteo](https://open-meteo.com/) API and all celestial math runs locally via `astronomy-engine`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/sky/overview` | General sky conditions for a location |
| GET | `/api/sky/planets` | Planet positions and visibility |
| GET | `/api/sky/moon` | Moon phase and rise/set data |
| GET | `/api/sky/stars` | Bright-star positions and details |
| GET | `/api/sky/deep-sky` | Deep-sky object visibility |
| GET | `/api/sky/events` | Upcoming celestial events |
| GET | `/api/sky/iss` | ISS pass predictions |
| GET | `/api/sky/weather` | Sky weather and seeing conditions |
| GET | `/api/sky/analemma` | Sun analemma data for a given hour |
| GET | `/api/nasa/images` | NASA image library search |

All endpoints accept `lat` and `lon` query parameters. See `lib/api-spec/openapi.yaml` for full parameter and response schemas.

---

## License

MIT
