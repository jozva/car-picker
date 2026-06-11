# CarPicker

A guided car finder that takes a confused buyer from *"I don't know what to buy"* to *"I'm confident about my shortlist."*

Answer a few quick questions → a transparent scoring engine ranks the catalogue → you get a ranked shortlist with **plain-English reasons and honest trade-offs** per car, a **value-for-money** read on each pick, a filterable catalogue, side-by-side compare, and the ability to save shortlists.

## Run it (under 2 minutes)

Requires **Node 18.18+** (Node 22 recommended — see `.nvmrc`). On Node 16 the build will refuse to start.

```bash
nvm use            # optional, picks up .nvmrc
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build && npm start   # production build
npm run typecheck            # tsc --noEmit
npm run lint                 # next lint
```

## What I built and why

The brief was deliberately vague, so I picked the single highest-value flow for a confused buyer: **a guided finder that produces an explained, ranked shortlist.** A confused buyer doesn't need more specs — they need an opinion and the reasoning behind it.

- **Guided finder** — a low-friction questionnaire (budget, body type, fuel, usage, priority sliders incl. *value for money*).
- **Transparent scoring engine** — hard filters (budget/seats/fuel/transmission) + soft, dataset-normalised factors (budget fit, mileage, safety, space, comfort, value), biased by how the buyer will actually use the car.
- **Value-for-money** — each car gets a **segment-relative** value score (objective "merit" ÷ price, normalised *within its body-type segment*), so a hatchback isn't judged against a 7-seat MUV.
- **Explained, not a black box** — every pick carries `reasons` and `caveats`, plus a per-factor score breakdown.
- **Browse** the full catalogue with live filters and select up to 4 cars to **compare** side by side.
- **Save shortlists** — persisted server-side and listed on a Saved page.

### Deliberately cut
- Auth / user accounts — shortlists are stored without a login.
- A hosted database — a validated JSON seed + file-backed store keep it runnable with zero infra (see the persistence note below).
- Live pricing/inventory, images, payments, dealer integration.
- Pixel-perfect design — clean and clear over polished.
- An LLM in the loop. Scoring + explanations are deterministic, fast, and free; natural-language entry is a fast-follow, not the core value.

## Tech stack and why

- **Next.js (App Router) + TypeScript** — frontend and a non-trivial backend (scoring API, persistence) in one repo, one command to run, trivial to deploy to Vercel.
- **Tailwind CSS** — fast, consistent, accessible UI without bikeshedding on styles.
- **Zod** — schemas are the single source of truth: domain types are *inferred* from them, so validation and types can't drift. Used for request payloads **and** data at rest.

## Architecture

```
src/
  app/
    page.tsx              landing
    finder/               questionnaire (client)
    results/              ranked shortlist + "save" (calls /api/recommend)
    browse/               catalogue with filters + compare selection
    compare/              side-by-side table
    saved/                saved shortlists
    api/
      recommend/          POST  preferences -> scored shortlist
      cars/               GET   catalogue / subset by ids / filtered
      shortlists/         GET, POST  list / save
      shortlists/[id]/    GET   one shortlist, cars hydrated
      health/             GET   liveness + dataset sanity
  lib/
    schemas.ts            zod schemas = source of truth for entities + payloads
    types.ts              types (mostly inferred from schemas)
    recommend.ts          the scoring engine — pure, catalogue injected
    api/response.ts       consistent { ok, data } | { ok, error } envelope
    repository/           data access (carRepository, shortlistRepository)
    services/             business rules (recommendation, shortlist)
  components/             NavBar, CarCard, ScoreBar
data/
  cars.json               seed dataset (validated on load)
```

**Layering:** `routes → services → { repository, engine }`.

- The **engine** (`recommend.ts`) is pure: it depends only on the preferences and the catalogue it's handed, never on a global data source — so it's reusable and trivially unit-testable. Flow: hard filters → usage-biased weights → per-factor normalised scores → ranked, explained output.
- **Repositories** are the only modules that know *how* data is stored, and they validate data at rest. Swapping the JSON seed / file store for a real DB is a one-file change per repository.
- **Services** own business rules (e.g. a shortlist may never reference a car that doesn't exist), keeping routes thin and the rules reusable from any entry point.
- Every API route returns one consistent envelope: `{ ok: true, data }` or `{ ok: false, error: { message, details? } }`.

### Persistence note
Saved shortlists are written to a local `.data/` file (atomic write, with in-process write serialization). That's durable for local / single-instance runs. On a serverless or multi-instance deploy the filesystem is ephemeral and per-instance, so production would swap `shortlistRepository` for a hosted DB — the repository seam makes that a single-file change.

## AI tools vs. manual

- **Delegated to AI:** scaffolding boilerplate (config, pages, components), the seed dataset, and first-pass wiring of API routes and UI.
- **Did / steered manually:** the product scoping call (what to build vs. cut), the scoring algorithm design (factors, weights, usage bias, segment-relative value), the architecture (validation boundaries, repository/service layering, decoupling the engine), and the explanation logic — the parts that carry the actual product value.
- **Where tools helped most:** turning a clear spec into runnable files quickly, and mechanical refactors across many files.
- **Where they got in the way:** environment friction (Node version, a corrupted native binary on install, stale Next.js build cache) needed manual diagnosis.

## If I had another 4 hours

- Natural-language entry ("family SUV under 20L, great mileage") → parsed into `Preferences` via an LLM, falling back to the deterministic engine.
- A real database for shortlists + shareable links (URL-encoded preferences make `/results` addressable).
- A larger, real dataset with images and 5-year cost-of-ownership estimates.
- A small Vitest suite over the (pure) scoring engine — hard-filter exclusion, segment-relative value, ranking monotonicity.
- Deploy to Vercel with a live URL.
