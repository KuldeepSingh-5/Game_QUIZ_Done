import { Router } from 'express';
import { Question } from '../models/Question.js';
import { adminMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// GET /api/questions — public, returns randomized questions for a game
router.get('/', async (req, res, next) => {
  try {
    const count = Math.min(parseInt(req.query.count || '40', 10), 100);
    const docs = await Question.aggregate([{ $sample: { size: count } }]);
    res.json({ questions: docs });
  } catch (err) {
    next(err);
  }
});

// ---- Admin-only question management ----

router.post('/', adminMiddleware, validate(schemas.createQuestion), async (req, res, next) => {
  try {
    const q = await Question.create(req.validated);
    res.status(201).json({ question: q });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', adminMiddleware, validate(schemas.updateQuestion), async (req, res, next) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.validated, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json({ question: q });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', adminMiddleware, async (req, res, next) => {
  try {
    const q = await Question.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
