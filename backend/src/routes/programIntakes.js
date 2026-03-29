import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { ProgramIntake } from '../models/ProgramIntake.js';
import { validateIntakePayload } from '../services/allocationService.js';

const router = Router();

router.get('/', authRequired, requireRoles('admin', 'admission_officer'), async (req, res) => {
  try {
    const q = {};
    if (req.query.programId) q.programId = req.query.programId;
    if (req.query.academicYearId) q.academicYearId = req.query.academicYearId;
    const rows = await ProgramIntake.find(q)
      .populate('programId')
      .populate('academicYearId')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    await validateIntakePayload(req.body);
    const quotas = req.body.quotas.map((q) => ({
      quotaType: q.quotaType,
      seats: Number(q.seats),
      filled: 0,
    }));
    const doc = await ProgramIntake.create({
      programId: req.body.programId,
      academicYearId: req.body.academicYearId,
      totalIntake: Number(req.body.totalIntake),
      quotas,
      supernumeraryTotal: Number(req.body.supernumeraryTotal || 0),
      supernumeraryFilled: 0,
    });
    const populated = await ProgramIntake.findById(doc._id)
      .populate('programId')
      .populate('academicYearId')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.patch('/:id', authRequired, requireRoles('admin'), async (req, res) => {
  try {
    const intake = await ProgramIntake.findById(req.params.id);
    if (!intake) return res.status(404).json({ message: 'Not found' });
    if (req.body.totalIntake != null || req.body.quotas) {
      const totalIntake = req.body.totalIntake != null ? Number(req.body.totalIntake) : intake.totalIntake;
      const quotas =
        req.body.quotas ||
        intake.quotas.map((q) => ({ quotaType: q.quotaType, seats: q.seats }));
      await validateIntakePayload({ totalIntake, quotas });
      intake.totalIntake = totalIntake;
      const oldFilled = Object.fromEntries(intake.quotas.map((q) => [q.quotaType, q.filled]));
      intake.quotas = quotas.map((q) => ({
        quotaType: q.quotaType,
        seats: Number(q.seats),
        filled: oldFilled[q.quotaType] ?? 0,
      }));
      for (const q of intake.quotas) {
        if (q.filled > q.seats) {
          return res.status(400).json({ message: `Cannot reduce seats below filled for ${q.quotaType}` });
        }
      }
    }
    if (req.body.supernumeraryTotal != null) {
      const n = Number(req.body.supernumeraryTotal);
      if (intake.supernumeraryFilled > n) {
        return res.status(400).json({ message: 'Supernumerary total below already filled' });
      }
      intake.supernumeraryTotal = n;
    }
    await intake.save();
    const populated = await ProgramIntake.findById(intake._id)
      .populate('programId')
      .populate('academicYearId')
      .lean();
    res.json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
