import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      passwordHash,
      role: 'admission_officer',
    });
    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .toLowerCase()
      .trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email name role').lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

export default router;
