import { Router } from 'express';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { GameResult } from '../models/GameResult.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = Router();

// All admin routes require the admin token
router.use(adminMiddleware);

// GET /api/admin/stats — basic game statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [users, questions, results] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      GameResult.countDocuments(),
    ]);
    const gamesToday = await GameResult.countDocuments({
      date: new Date().toISOString().slice(0, 10),
    });
    const topScore = await GameResult.findOne().sort({ score: -1 }).limit(1);
    res.json({
      totalUsers: users,
      totalQuestions: questions,
      totalGamesPlayed: results,
      gamesPlayedToday: gamesToday,
      highestScore: topScore?.score ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/questions — list all questions (paginated)
router.get('/questions', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Question.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
