# Smart Stock — Frontend

> Accessible Supply Chain Intelligence for Small-Scale Restaurants.

Smart Stock is a lightweight, cloud-native web application that replaces manual inventory guesswork with AI-driven precision. This repository contains the Next.js frontend, deployed on Vercel.

---

## About

Small-scale restaurants operate on thin margins, often trapped between inefficient paper tracking and expensive enterprise software they cannot afford. Smart Stock evolves inventory management from a labor-intensive chore into an AI-assisted strategic asset using a Bring Your Own Device (BYOD) model — no proprietary hardware required.

The frontend is a client-rendered Next.js App Router application. It holds no database of its own: every screen talks to the `smartstock-back` Flask API through a single `apiFetch` wrapper (`lib/api.ts`), authenticated with a JWT issued at login.

### Features

- **Stockout & expiry alerts** — `lib/alerts.ts` evaluates items against their per-item `minimum_threshold` and upcoming expiry dates; surfaced through `components/alerts/` and the notification bell in the topbar.
- **Demand forecasting** — `lib/forecast.ts` calls the backend's RandomForest `POST /api/forecast`, parses the response defensively, and runs a plausibility check against historical stats before anything renders.
- **Operational assistant** — `/assistant` combines the natural-language chatbot (`lib/chat.ts` → `POST /api/chat`) with inventory forecast, historical trends, and alert-center tabs.
- **Smart Sourcing** — supplier directory, cross-supplier price comparison, and price history (`components/sourcing/`).
- **Waste logging & trends** — log discarded stock (`LogWasteForm`), bucketed into a monthly trend chart (`lib/waste.ts`, `WasteTrendChart`).
- **Reorder suggestions** — `suggestReorders` in `lib/inventory.ts` ranks what to restock by severity.
- **Role-based access control** — Owner / Admin / Manager / Employee, enforced client-side by `components/auth/RoleGuard.tsx` and by the backend on every mutating route. Account management lives at `/accounts`.
- **Light / dark theme** — `lib/theme.ts` + `ThemeProvider`; follows the OS preference until the user picks a side.

### Route status

| Route         | Status                            |
| ------------- | --------------------------------- |
| `/login`      | Shipped                           |
| `/dashboard`  | Shipped                           |
| `/inventory`  | Shipped                           |
| `/assistant`  | Shipped                           |
| `/sourcing`   | Shipped                           |
| `/reports`    | Shipped                           |
| `/accounts`   | Shipped (Admin / Manager only)    |
| `/settings`   | Shipped                           |
| `/menu`       | Planned — placeholder page        |
| `/analytics`  | Planned — placeholder page        |

`/` redirects to `/login`.

---

## Tech Stack

| Layer       | Technology                                                |
| ----------- | --------------------------------------------------------- |
| Framework   | Next.js 14 (App Router, client components)                |
| Language    | TypeScript 5.4                                            |
| Styling     | Tailwind CSS 3.4                                          |
| Data access | `apiFetch` wrapper (`lib/api.ts`) over the Flask REST API |
| Auth        | JWT issued by `smartstock-back`, held in `localStorage`   |
| Testing     | Vitest                                                    |
| Hosting     | Vercel                                                    |
| Backend API | `smartstock-back` (separate repo)                         |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A running `smartstock-back` instance (local or the deployed Render URL)

### Installation

```bash
git clone https://github.com/junhojeon77/smartstock-front.git
cd smartstock-front
npm install
```

### Local Development

```bash
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will land on the login page — sign in with an account seeded by the backend's `seed.py`.

> Without a reachable backend every page shows *"Backend unavailable — start the Flask server or check `NEXT_PUBLIC_API_URL`."* That error comes from `lib/api.ts`; it means the frontend is fine and the API is not.

### Environment Variables

| Variable              | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Smart Stock backend API. Defaults to `http://localhost:8000` when unset. |

`.env.example` also carries `NEXTAUTH_URL` and `NEXTAUTH_SECRET`. These are leftovers from the original scaffold — NextAuth is not installed and neither variable is read anywhere.

### Build & Production

```bash
npm run build
npm run start
```

---

## Testing

```bash
npm test          # vitest run — 6 suites, 63 tests
npm run test:watch
```

The suites cover the pure logic in `lib/`: alert evaluation, chat fallbacks, forecast parsing and plausibility, inventory status and reorder ranking, supplier price parsing, and waste bucketing. They mock `fetch` and need no backend.

```bash
npm run test:employee-roundtrip
```

`scripts/employee-roundtrip-test.js` is a separate end-to-end check that hits a **live** backend to verify employee-role permissions round-trip correctly. It is deliberately not part of `npm test`.

---

## Project Structure

```text
smartstock-front/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar shell + auth gate
│   │   ├── accounts/                 # User & role management (Admin / Manager)
│   │   ├── analytics/                # Placeholder
│   │   ├── assistant/                # Chatbot, forecast, trends, alerts
│   │   ├── dashboard/                # Overview: alerts, reorders, waste trend
│   │   ├── inventory/                # Stock levels, thresholds, waste logging
│   │   ├── menu/                     # Placeholder
│   │   ├── reports/                  # Stock status & price reporting
│   │   ├── settings/                 # Theme, restock cycle, account details
│   │   └── sourcing/                 # Smart Sourcing
│   ├── layout.tsx                    # Root layout + ThemeProvider
│   ├── page.tsx                      # Redirects to /login
│   └── globals.css
│
├── components/
│   ├── alerts/                       # AlertsCenter, AlertsPanel, NotificationBell, AlertNotification
│   ├── assistant/                    # InventoryForecastTab, HistoricalTrendsTab
│   ├── auth/RoleGuard.tsx            # Client-side role gate
│   ├── charts/WasteTrendChart.tsx
│   ├── chat/Chatbot.tsx
│   ├── forecast/ForecastWidget.tsx
│   ├── inventory/ReorderSuggestions.tsx
│   ├── layout/                       # Sidebar, Topbar
│   ├── sourcing/                     # SmartSourcing, SupplierDirectory, PriceComparison
│   ├── theme/                        # ThemeProvider, ThemeToggle
│   ├── ui/                           # Button, Card, Input
│   └── waste/LogWasteForm.tsx
│
├── lib/
│   ├── alerts.ts                     # Stockout / expiry evaluation, threshold config
│   ├── api.ts                        # apiFetch — auth header, error normalization
│   ├── auth.ts                       # Token & user storage, role normalization
│   ├── chat.ts                       # POST /api/chat
│   ├── forecast.ts                   # POST /api/forecast + response plausibility
│   ├── inventory.ts                  # Item status, reorder suggestions
│   ├── suppliers.ts                  # Supplier list & price parsing
│   ├── theme.ts                      # Theme resolution & persistence
│   ├── utils.ts
│   └── waste.ts                      # Waste log fetch/post, monthly bucketing
│
├── tests/                            # Vitest suites for lib/
├── scripts/employee-roundtrip-test.js
├── types/index.ts                    # Shared API types
├── images/                           # Screenshots
├── public/
│
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Deployment

The app is deployed to **Vercel**. Pushes to `main` trigger a production deploy; pull requests get preview deployments automatically.

```bash
# Manual deploy (optional)
vercel --prod
```

---

## Scripts

| Command                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `npm run dev`                    | Start local dev server                             |
| `npm run build`                  | Build for production                               |
| `npm run start`                  | Run the production build                           |
| `npm run lint`                   | Run ESLint                                         |
| `npm test`                       | Run the Vitest suite once                          |
| `npm run test:watch`             | Run Vitest in watch mode                           |
| `npm run test:employee-roundtrip`| Live-backend employee permission round-trip check  |

---

## Related Repositories

- **[smartstock-back](https://github.com/NikanEidi/smartstock-back)** — Flask REST API, MongoDB Atlas, JWT auth + RBAC, chatbot and demand-forecast models. Deployed on Render; `.env.example` points at that deployment by default.

---

## License

TBD
