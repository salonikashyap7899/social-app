import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/** Rejects the request unless a valid `Authorization: Bearer <token>` is present. */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

/**
 * Same as requireAuth but never blocks - used by the public feed so that
 * signed-in visitors still get their `likedByMe` flag.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.id);
    }
  } catch {
    req.user = null; // an expired token simply means "anonymous"
  }
  next();
}
