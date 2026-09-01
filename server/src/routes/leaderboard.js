import { Router } from 'express';
import { GameResult } from '../models/GameResult.js';
import { User } from '../models/User.js';

const router = Router();

// GET /api/leaderboard?scope=all|daily
router.get('/', async (req, res, next) => {
  try {
    const scope = req.query.scope === 'daily' ? 'daily' : 'all';
    const today = new Date().toISOString().slice(0, 10);

    if (scope === 'daily') {
      const top = await GameResult.aggregate([
        { $match: { date: today } },
        { $sort: { score: -1 } },
        { $group: { _id: '$userId', bestScore: { $max: '$score' }, xp: { $sum: '$xpEarned' } } },
        { $sort: { bestScore: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ]);
      const entries = top.map((r, i) => ({
        rank: i + 1,
        username: r.user.username,
        score: r.bestScore,
        xp: r.xp,
        streak: r.user.streak,
      }));
      return res.json({ entries });
    }

    // All-time leaderboard from user stats
    const users = await User.find().sort({ highestScore: -1, xp: -1 }).limit(50);
    const entries = users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      score: u.highestScore,
      xp: u.xp,
      streak: u.streak,
    }));
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

export default router;
