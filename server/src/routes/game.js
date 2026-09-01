import { Router } from 'express';
import { GameResult } from '../models/GameResult.js';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';
import { gameLimiter } from '../middleware/rateLimit.js';
import { computeStreak, getTodayDateString, getLevelFromXp } from '../utils/date.js';

const router = Router();

// POST /api/game/submit — record a finished game (authenticated)
router.post('/submit', authMiddleware, gameLimiter, validate(schemas.submitGame), async (req, res, next) => {
  try {
    const { score, correctAnswers, attemptedQuestions, xpEarned } = req.validated;

    // Basic anti-cheat: score can't exceed attempted * 10
    const maxPossible = attemptedQuestions * 10;
    if (score > maxPossible) {
      return res.status(400).json({ error: 'Score exceeds maximum possible for attempts' });
    }
    if (correctAnswers > attemptedQuestions) {
      return res.status(400).json({ error: 'Correct answers exceed attempts' });
    }

    const today = getTodayDateString();
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await GameResult.create({
      userId: user._id,
      score,
      correctAnswers,
      attemptedQuestions,
      xpEarned,
      date: today,
    });

    user.xp += xpEarned;
    user.level = getLevelFromXp(user.xp);
    user.streak = computeStreak(user.lastPlayedDate, user.streak, today);
    user.lastPlayedDate = today;
    user.highestScore = Math.max(user.highestScore, score);

    if (user.todayDate !== today) {
      user.todayBestScore = score;
      user.todayDate = today;
    } else {
      user.todayBestScore = Math.max(user.todayBestScore, score);
    }
    user.totalGamesPlayed += 1;

    await user.save();

    res.json({ stats: user, result });
  } catch (err) {
    next(err);
  }
});

// GET /api/game/history — current user's past results
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const results = await GameResult.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
