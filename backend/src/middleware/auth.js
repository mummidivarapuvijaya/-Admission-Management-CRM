import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

/** Authorize using the current row in MongoDB (stops stale JWTs if role changed; blocks tampered role claims). */
export function requireDbRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ message: 'Authentication required' });
    try {
      const u = await User.findById(req.user.id).select('role').lean();
      if (!u) return res.status(401).json({ message: 'User not found' });
      if (!allowedRoles.includes(u.role)) {
        return res.status(403).json({
          message:
            'This action is only allowed for an Admission Officer. The Management role is view-only (dashboard); it cannot allocate seats.',
        });
      }
      return next();
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  };
}

export async function attachUserDoc(req, res, next) {
  try {
    const u = await User.findById(req.user.id).select('name email role').lean();
    if (!u) return res.status(401).json({ message: 'User not found' });
    req.userDoc = u;
    return next();
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
