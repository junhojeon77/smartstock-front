# Smart Stock — Frontend

> Accessible Supply Chain Intelligence for Small-Scale Restaurants.

Smart Stock is a lightweight, cloud-native web application that replaces manual inventory guesswork with AI-driven precision. This repository contains the Next.js frontend, deployed on Vercel.

---

## About

Small-scale restaurants operate on thin margins, often trapped between inefficient paper tracking and expensive enterprise software they cannot afford. Smart Stock evolves inventory management from a labor-intensive chore into an AI-assisted strategic asset using a Bring Your Own Device (BYOD) model — no proprietary hardware required.

### Key Features

- **AI-Driven Demand Prediction** — Analyzes historical sales and menu data to predict ingredient needs with precision, reducing food waste.
- **Smart Sourcing Module** — Automatically identifies the best prices from local vendors in real-time to optimize procurement costs.
- **Cloud-Native & BYOD** — Fully web-based; use the devices you already own.
- **Enterprise-Grade Analytics** — Insights designed to maximize profits for startups and small businesses.

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Framework        | Next.js 14+ (App Router)            |
| Language         | TypeScript                          |
| Styling          | Tailwind CSS                        |
| State / Data     | React Server Components + fetch     |
| Auth             | (TBD — NextAuth.js / Clerk)         |
| Hosting          | Vercel                              |
| Backend API      | `smartstock-back` (separate repo)   |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm / pnpm / yarn

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable               | Description                              |
| ---------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | URL of the Smart Stock backend API       |
| `NEXTAUTH_SECRET`      | Secret for session signing (if used)     |

### Build & Production

```bash
npm run build
npm run start
```

---

## Project Structure

```text
smartstock-front/
├── app/                       # Next.js App Router
│   ├── (auth)/                # Auth route group (login, signup)
│   ├── (dashboard)/           # Authenticated app routes
│   │   ├── dashboard/         # Overview / home
│   │   ├── inventory/         # Stock levels, items, ingredients
│   │   ├── menu/              # Menu items & recipes
│   │   ├── sourcing/          # Vendor pricing & procurement
│   │   ├── analytics/         # Demand prediction & reports
│   │   └── settings/
│   ├── api/                   # Route handlers (proxy / BFF)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css
│
├── components/                # Reusable React components
│   ├── ui/                    # Primitive UI (buttons, inputs, modals)
│   ├── layout/                # Navbar, sidebar, page shells
│   ├── inventory/             # Inventory-specific components
│   ├── charts/                # Analytics & visualization
│   └── forms/                 # Reusable form components
│
├── lib/                       # Shared utilities
│   ├── api.ts                 # API client / fetch wrappers
│   ├── auth.ts                # Auth helpers
│   └── utils.ts               # Misc helpers (cn, formatters)
│
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript type definitions
├── public/                    # Static assets (images, icons)
│
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
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

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start local dev server               |
| `npm run build` | Build for production                 |
| `npm run start` | Run the production build             |
| `npm run lint`  | Run ESLint                           |

---

## Related Repositories

- **smartstock-back** — Backend API, AI models, and data pipeline.

---

## License

TBD
