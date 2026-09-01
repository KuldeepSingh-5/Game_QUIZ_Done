# Daily Challenge — Server

Node.js + Express + MongoDB backend for the Daily Challenge game.

## Setup

```bash
cd server
cp .env.example .env      # then edit values
npm install
npm run seed              # load starter questions into MongoDB
npm run dev               # start API (auto-reloads on save)
```

## Environment variables

| Variable       | Description                                  |
| -------------- | -------------------------------------------- |
| `PORT`         | Port the API listens on (default `5000`)      |
| `MONGODB_URI`  | MongoDB connection string                     |
| `JWT_SECRET`   | Secret used to sign auth tokens               |
| `CLIENT_URL`   | Allowed CORS origin(s), comma-separated        |
| `ADMIN_TOKEN`  | Secret token required for admin endpoints     |

## API endpoints

| Method | Path                       | Auth        | Description                       |
| ------ | -------------------------- | ----------- | --------------------------------- |
| GET    | `/api/questions`           | Public      | Randomized questions for a game    |
| POST   | `/api/questions`           | Admin       | Create a question                  |
| PUT    | `/api/questions/:id`       | Admin       | Edit a question                    |
| DELETE | `/api/questions/:id`       | Admin       | Delete a question                  |
| POST   | `/api/users/register`     | Public      | Register (email/password)          |
| POST   | `/api/users/login`         | Public      | Login                              |
| GET    | `/api/users/me`            | User        | Current user profile               |
| POST   | `/api/game/submit`         | User        | Submit a finished game (anti-cheat) |
| GET    | `/api/game/history`        | User        | User's past results                |
| GET    | `/api/leaderboard`         | Public      | All-time or daily leaderboard      |
| GET    | `/api/admin/stats`         | Admin       | Basic game statistics              |
| GET    | `/api/admin/questions`     | Admin       | Paginated question list            |

## Security

- Passwords hashed with bcrypt (cost 12)
- JWT auth tokens (7-day expiry)
- Zod input validation on all write routes
- Helmet security headers
- CORS allowlist
- Rate limiting (global + per-game submission)
- Anti-cheat: server rejects impossible score/attempt combinations
- Admin endpoints gated behind `x-admin-token` header
- Generic error messages — raw errors never sent to clients
