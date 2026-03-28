# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite with Tailwind CSS, Recharts, Framer Motion

## Application: BallistiCalc

A professional ballistic calculator web app targeting the market gap left by Strelok Pro (removed from app stores after sanctions).

### Features
- **Ballistic trajectory calculation** using G1 and G7 drag models
- **Environmental corrections**: wind, temperature, altitude, humidity, barometric pressure, target angle
- **Rifle/ammo profile management**: save, load, edit profiles
- **Results display**: drop table with MOA/MRAD corrections, trajectory chart
- **Pre-loaded example profiles**: 6.5 Creedmoor, .308 Win, .300 Win Mag, 6mm ARC, 7 PRC
- **Dark tactical UI** with amber accent colors

### Pages
- `/` — Calculator (main interface)
- `/profiles` — Rifle Arsenal (profile management)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── ballistic-calculator/ # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Routes

- `GET /api/healthz` — health check
- `GET /api/profiles` — list all saved profiles
- `POST /api/profiles` — create profile
- `GET /api/profiles/:id` — get profile
- `PUT /api/profiles/:id` — update profile
- `DELETE /api/profiles/:id` — delete profile
- `POST /api/calculate` — run ballistic calculation

## Database Schema

### profiles table
- id, name, caliber, bullet_weight, bullet_diameter, muzzle_velocity
- ballistic_coefficient, bc_model (G1/G7), zero_range, scope_height, rifle_weight
- notes, created_at

## Key Files

- `artifacts/api-server/src/lib/ballistics.ts` — Core ballistic calculation engine (G1/G7 drag models, wind drift, air density)
- `artifacts/api-server/src/routes/profiles.ts` — Profile CRUD routes
- `artifacts/api-server/src/routes/calculate.ts` — Calculation endpoint
- `lib/db/src/schema/profiles.ts` — Drizzle schema
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth)

## Commands

- `pnpm --filter @workspace/api-server run dev` — run the API dev server
- `pnpm --filter @workspace/ballistic-calculator run dev` — run the frontend
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types
- `pnpm --filter @workspace/db run push` — push DB schema changes
