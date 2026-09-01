import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import questionsRouter from './routes/questions.js';
import usersRouter from './routes/users.js';
import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

if (isProd && !process.env.JWT_SECRET) {
  console.error('[server] FATAL: JWT_SECRET is required in production.');
  process.exit(1);
}
if (isProd && !process.env.MONGODB_URI) {
  console.error('[server] FATAL: MONGODB_URI is required in production.');
  process.exit(1);
}
if (isProd && !process.env.ADMIN_TOKEN) {
  console.error('[server] FATAL: ADMIN_TOKEN is required in production.');
  process.exit(1);
}

const app = express();

// Security & middleware
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
  })
);
app.options('*', (req, res) => res.sendStatus(204));
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/game', gameRouter);
app.use('/api/scores', leaderboardRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export { app };

// Start
if (process.argv[1] && !process.argv[1].includes('test')) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[server] Daily Challenge API running on port ${PORT}`);
    });
  });
}
