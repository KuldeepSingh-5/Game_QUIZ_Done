import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  if (isProd) {
    console.error('[auth] FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
  }
  console.warn('[auth] WARNING: JWT_SECRET not set, using insecure dev fallback.');
}

const SIGNING_SECRET = SECRET || 'dev_secret';

export function signToken(userId) {
  return jwt.sign({ id: userId }, SIGNING_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, SIGNING_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || '';
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || !token || token !== adminToken) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
