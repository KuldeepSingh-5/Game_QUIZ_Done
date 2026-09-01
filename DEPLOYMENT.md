# Deployment Guide — Daily Challenge

## Architecture

- **Frontend**: React + Vite + Tailwind CSS, deployed as static files
- **Database/Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Backend (optional)**: Express + MongoDB (legacy API server)

The frontend talks directly to Supabase for all data operations (auth, game,
leaderboard, admin). The Express/MongoDB backend is a standalone legacy API
that can be deployed separately if needed.

---

## Frontend Deployment

### Option A: Vercel

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Set the framework preset to **Vite**
4. Add environment variables (see below)
5. Deploy — Vercel auto-detects `npm run build` and serves `dist/`

### Option B: Netlify

1. Push the repository to GitHub
2. Go to [netlify.com](https://netlify.com) and import the repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables (see below)
6. Deploy

### Option C: Any static host (Cloudflare Pages, S3, etc.)

1. Run `npm install && npm run build`
2. Upload the contents of `dist/` to your static host
3. Configure your host to serve `index.html` for all routes (SPA fallback)

### Frontend Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_ADS_ENABLED` | No | Set to `true` to enable ads (default: `false`) |
| `VITE_INTERSTITIAL_FREQUENCY` | No | Show interstitial every N games (default: `3`) |
| `VITE_REWARDED_ADS_ENABLED` | No | Enable rewarded ads (default: `true` when ads on) |
| `VITE_AD_UNIT_BANNER` | No | Banner ad unit ID |
| `VITE_AD_UNIT_INTERSTITIAL` | No | Interstitial ad unit ID |
| `VITE_AD_UNIT_REWARDED` | No | Rewarded ad unit ID |

---

## Backend Deployment (Express + MongoDB)

The backend is optional — the frontend uses Supabase directly. Deploy it only
if you need the legacy MongoDB-based API.

### Deploy to Render / Railway / Fly.io / VPS

1. Push the repository to GitHub
2. Create a new service pointing to the `server/` directory
3. Set the start command to `npm start`
4. Add environment variables (see below)
5. Deploy

### Backend Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API listen port (default: `5000`) |
| `NODE_ENV` | Yes | Set to `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string (min 32 chars) for JWT signing |
| `CLIENT_URL` | Yes | Comma-separated list of allowed frontend origins |
| `ADMIN_TOKEN` | Yes | Long random string for admin API access |

---

## MongoDB Setup

### Option A: MongoDB Atlas (recommended for production)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user (username + password)
3. Add your backend server's IP to the Network Access list (or `0.0.0.0/0` for all)
4. Get the connection string from "Connect > Drivers":
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/daily_challenge?retryWrites=true&w=majority
   ```
5. Set this as the `MONGODB_URI` environment variable

### Option B: Self-hosted MongoDB

1. Install MongoDB on your server
2. Create a database and user:
   ```bash
   mongosh
   use daily_challenge
   db.createUser({ user: "appuser", pwd: "YOUR_STRONG_PASSWORD", roles: ["readWrite"] })
   ```
3. Connection string: `mongodb://appuser:YOUR_STRONG_PASSWORD@localhost:27017/daily_challenge`
4. Set this as the `MONGODB_URI` environment variable

### Seed Questions (backend only)

```bash
cd server
npm install
npm run seed
```

---

## Supabase Setup

The Supabase project is already provisioned. Migrations are applied
automatically. To verify:

1. Go to your Supabase dashboard
2. Confirm all migrations are applied under Database > Migrations
3. Confirm RLS is enabled on all tables under Authentication > Policies
4. The `ad_settings` table should have `ads_enabled = false` (ads disabled by default)

---

## Production Build Commands

### Frontend

```bash
npm install
npm run build        # outputs to dist/
npm run preview      # local preview of production build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
```

### Backend

```bash
cd server
npm install
npm start            # starts Express server
npm run seed         # seed MongoDB with questions (run once)
```

---

## Production Testing Checklist

- [ ] Frontend builds without errors (`npm run build`)
- [ ] TypeScript passes (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Frontend loads on production domain
- [ ] Guest can play: Home → Start → Play → Result
- [ ] User can register: Register → Login → Play → Result → Profile
- [ ] Leaderboard displays all-time and daily tabs
- [ ] Admin can access admin panel (if admin role set)
- [ ] Admin can add/edit/delete/toggle questions
- [ ] Ads are disabled by default (no ad placeholders visible)
- [ ] Dark/light theme toggle works
- [ ] Responsive at 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px
- [ ] No console errors or warnings
- [ ] Backend health check responds: `GET /health` → `{ "ok": true }`
- [ ] CORS allows requests from the frontend domain only
- [ ] JWT tokens are signed with the production secret
- [ ] MongoDB connection uses the production connection string
- [ ] No `.env` files are committed to GitHub
