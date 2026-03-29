import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { ProgramIntake } from '../models/ProgramIntake.js';
import { Applicant } from '../models/Applicant.js';

const router = Router();

router.get(
  '/summary',
  authRequired,
  requireRoles('admin', 'admission_officer', 'management'),
  async (req, res) => {
  try {
    const yearFilter = req.query.academicYearId ? { academicYearId: req.query.academicYearId } : {};

    const intakes = await ProgramIntake.find(yearFilter).populate('programId').populate('academicYearId').lean();

    let totalIntake = 0;
    const quotaTotals = { KCET: { seats: 0, filled: 0 }, COMEDK: { seats: 0, filled: 0 }, Management: { seats: 0, filled: 0 } };
    let seatsFilledInQuotas = 0;
    let supernumeraryRemaining = 0;

    for (const pi of intakes) {
      totalIntake += pi.totalIntake;
      for (const q of pi.quotas) {
        seatsFilledInQuotas += q.filled;
        if (quotaTotals[q.quotaType]) {
          quotaTotals[q.quotaType].seats += q.seats;
          quotaTotals[q.quotaType].filled += q.filled;
        }
      }
      supernumeraryRemaining += (pi.supernumeraryTotal || 0) - (pi.supernumeraryFilled || 0);
    }

    const admittedQuery = { admissionStatus: 'Confirmed', ...yearFilter };
    const totalAdmitted = await Applicant.countDocuments(admittedQuery);

    const pendingDocs = await Applicant.countDocuments({
      documentStatus: { $ne: 'Verified' },
      admissionStatus: { $in: ['Allocated', 'Confirmed'] },
      ...yearFilter,
    });

    const feePending = await Applicant.find({
      feeStatus: 'Pending',
      admissionStatus: { $in: ['Allocated', 'Draft'] },
      ...yearFilter,
    })
      .select('firstName lastName email programId')
      .populate('programId', 'name branchCode')
      .limit(50)
      .lean();

    const intakeRows = intakes.map((pi) => ({
      _id: pi._id,
      program: pi.programId,
      academicYear: pi.academicYearId,
      totalIntake: pi.totalIntake,
      quotas: pi.quotas,
      supernumeraryTotal: pi.supernumeraryTotal,
      supernumeraryFilled: pi.supernumeraryFilled,
      remainingByQuota: pi.quotas.map((q) => ({
        quotaType: q.quotaType,
        remaining: q.seats - q.filled,
        filled: q.filled,
        seats: q.seats,
      })),
    }));

    const baseRemaining = totalIntake - seatsFilledInQuotas;

    res.json({
      totalIntake,
      totalAdmitted,
      seatsFilledInQuotas,
      remainingSeatsOverall: baseRemaining,
      supernumeraryRemaining,
      quotaTotals,
      pendingDocumentsCount: pendingDocs,
      feePendingApplicants: feePending,
      intakes: intakeRows,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
  }
);

export default router;
