import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { Institution } from '../models/Institution.js';
import { Campus } from '../models/Campus.js';
import { Department } from '../models/Department.js';
import { Program } from '../models/Program.js';
import { AcademicYear } from '../models/AcademicYear.js';

const router = Router();

router.get('/institutions', authRequired, requireRoles('admin'), async (_req, res) => {
  const rows = await Institution.find().sort({ name: 1 }).lean();
  res.json(rows);
});

router.post('/institutions', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const doc = await Institution.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/campuses', authRequired, requireRoles('admin'), async (req, res) => {
  const q = req.query.institutionId ? { institutionId: req.query.institutionId } : {};
  const rows = await Campus.find(q).populate('institutionId', 'name code').sort({ name: 1 }).lean();
  res.json(rows);
});

router.post('/campuses', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const doc = await Campus.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/departments', authRequired, requireRoles('admin'), async (req, res) => {
  const q = req.query.campusId ? { campusId: req.query.campusId } : {};
  const rows = await Department.find(q).populate('campusId', 'name code').sort({ name: 1 }).lean();
  res.json(rows);
});

router.post('/departments', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const doc = await Department.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/programs', authRequired, requireRoles('admin', 'admission_officer'), async (req, res) => {
  const q = req.query.departmentId ? { departmentId: req.query.departmentId } : {};
  const rows = await Program.find(q).populate('departmentId', 'name code').sort({ name: 1 }).lean();
  res.json(rows);
});

router.post('/programs', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const doc = await Program.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// All authenticated roles (including management) — needed for dashboard year filter
router.get('/academic-years', authRequired, async (_req, res) => {
  const rows = await AcademicYear.find().sort({ year: -1 }).lean();
  res.json(rows);
});

router.post('/academic-years', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const doc = await AcademicYear.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
