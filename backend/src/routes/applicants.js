import { Router } from 'express';
import { authRequired, requireDbRole } from '../middleware/auth.js';
import { Applicant } from '../models/Applicant.js';

const router = Router();

router.get('/', authRequired, requireDbRole('admission_officer'), async (req, res) => {
  try {
    const q = {};
    if (req.query.academicYearId) q.academicYearId = req.query.academicYearId;
    if (req.query.programId) q.programId = req.query.programId;
    const rows = await Applicant.find(q)
      .populate('programId')
      .populate('academicYearId')
      .populate('programIntakeId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', authRequired, requireDbRole('admission_officer'), async (req, res) => {
  const row = await Applicant.findById(req.params.id)
    .populate('programId')
    .populate('academicYearId')
    .populate('programIntakeId')
    .lean();
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

router.post('/', authRequired, requireDbRole('admission_officer'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.admissionNumber == null || body.admissionNumber === '') delete body.admissionNumber;
    delete body.documentFileName;
    if (!String(body.allotmentNumber || '').trim()) delete body.allotmentNumber;
    if (!String(body.motherName || '').trim()) body.motherName = '';
    for (const k of ['city', 'state', 'pincode']) {
      if (!String(body[k] || '').trim()) body[k] = '';
    }
    const doc = await Applicant.create(body);
    const populated = await Applicant.findById(doc._id)
      .populate('programId')
      .populate('academicYearId')
      .lean();
    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.patch('/:id', authRequired, requireDbRole('admission_officer'), async (req, res) => {
  try {
    const existing = await Applicant.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const body = { ...req.body };
    delete body.admissionNumber;
    if (body.documentFileName != null && typeof body.documentFileName === 'string') {
      body.documentFileName = body.documentFileName.trim().slice(0, 512);
    }
    // Allocation state must change only via POST /api/allocations/* so ProgramIntake quota counters stay correct.
    for (const key of [
      'admissionStatus',
      'programIntakeId',
      'seatLockedQuota',
      'allocatedAt',
      'usesSupernumerary',
      'allotmentNumber',
    ]) {
      delete body[key];
    }
    if (existing.admissionStatus === 'Confirmed' && body.feeStatus === 'Pending') {
      return res.status(400).json({ message: 'Cannot revert fee after confirmation' });
    }
    Object.assign(existing, body);
    await existing.save();
    const populated = await Applicant.findById(existing._id)
      .populate('programId')
      .populate('academicYearId')
      .populate('programIntakeId')
      .lean();
    res.json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
