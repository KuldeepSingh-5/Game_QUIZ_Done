# Daily Challenge

A modern, responsive 60-second daily brain-challenge game built with React, Vite, and Tailwind CSS, plus a production-ready Node.js/Express/MongoDB backend.

## What it is

Players answer as many questions as possible in 60 seconds. Each correct answer earns points and XP. The app tracks streaks, levels, achievements, and leaderboards — all wrapped in a polished, mobile-first interface with dark/light themes.

## Frontend (this project)

The frontend is a fully working MVP that runs entirely in the browser with localStorage persistence, so you can play immediately without a backend. A complete Express + MongoDB backend is included under `server/` for production use.

### Run the frontend

```bash
npm install
npm run dev
```

The app runs on the Vite dev server (already started in this environment).

### Build

```bash
npm run build
npm run preview
```

## Backend

See [`server/README.md`](server/README.md) for full setup, API reference, and security details.

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Required `.env` variables (backend)

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `ADMIN_TOKEN`

### MongoDB setup

1. Install MongoDB locally or create a free cluster on MongoDB Atlas.
2. Copy your connection string into `MONGODB_URI` in `server/.env`.
3. Run `npm run seed` to load starter questions.

## Features

- 60-second timed challenge with random question/answer order
- Real-time score, correct count, and countdown timer
- Correct/wrong feedback with auto-advance (double-click protected)
- Result screen with final score, XP, streak, highest score, and motivational message
- 32 unique motivational messages (performance-based)
- XP and 5-level progression (Beginner → Champion) with progress bar
- Streak tracking (1 / 7 / 30-day tiers) using UTC dates to avoid timezone bugs
- All-time and daily leaderboards
- Achievement badges
- Dark and light theme with system preference detection
- Mobile-first responsive design (320px → 1440px+), bottom nav on mobile
- Guest mode (no account needed to play)
- Reusable ad placeholder components (banner, interstitial, rewarded)
- Friendly error states (network, no questions, server errors)
- Backend: Express REST API, MongoDB models, bcrypt hashing, JWT auth, Zod validation, rate limiting, Helmet, CORS, anti-cheat validation, admin panel structure

## Tech stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, lucide-react
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Zod

## Production deployment

- **Frontend:** `npm run build` outputs static files in `dist/`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages). Set the API base URL in `src/services/api.ts` to your backend URL.
- **Backend:** Deploy `server/` to Render, Railway, Fly.io, or any Node host. Set the environment variables from `.env.example` in your host's dashboard. Ensure MongoDB is reachable from the backend host.

## Limitations

- The frontend currently uses localStorage and mock questions; to use the live backend, point `src/services/api.ts` at the backend URL and swap the mock calls for `fetch` requests.
- Authentication UI (login/register screens) is architecturally prepared but not yet surfaced in the MVP — the backend endpoints are ready.
- No real ads are served; placeholder components are in place for a future ad network integration.
