import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authMiddleware, signToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = Router();

// POST /api/users/guest — create or retrieve a guest player
router.post('/guest', async (req, res, next) => {
  try {
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const username = `Guest_${randomSuffix}`;
    const email = `guest_${randomSuffix}@daily.challenge`;
    const passwordHash = await bcrypt.hash(randomSuffix, 12);
    const user = await User.create({ username, email, passwordHash, isGuest: true });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/register
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { username, email, password } = req.validated;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'Username or email already in use' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me — current user profile
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
