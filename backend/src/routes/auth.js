import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Keeps brute-force attempts against signup/login cheap to absorb.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes' },
});

/** POST /api/auth/signup - create an account and return a session token. */
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are all required' });
    }

    // Friendlier than waiting for the unique-index error.
    const clash = await User.findOne({ $or: [{ email }, { username }] });
    if (clash) {
      const field = clash.email === email ? 'email' : 'username';
      return res.status(409).json({ message: `That ${field} is already registered` });
    }

    const user = await User.create({ username, email, password });
    res.status(201).json({ token: signToken(user._id), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/login - exchange email + password for a session token. */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    // Same message either way so we do not reveal which emails exist.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    res.json({ token: signToken(user._id), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

/** GET /api/auth/me - who am I? Used to restore a session on page load. */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

export default router;
