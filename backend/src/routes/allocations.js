import { Router } from 'express';
import { authRequired, requireDbRole } from '../middleware/auth.js';
import { allocateSeat, confirmAdmission } from '../services/allocationService.js';
import { Applicant } from '../models/Applicant.js';

async function populatedApplicant(id) {
  return Applicant.findById(id).populate('programId').populate('academicYearId').populate('programIntakeId').lean();
}

const router = Router();

router.post(
  '/government',
  authRequired,
  requireDbRole('admission_officer'),
  async (req, res) => {
    try {
      const { applicantId, programIntakeId, quotaType, allotmentNumber } = req.body;
      const applicant = await allocateSeat({
        applicantId,
        programIntakeId,
        quotaType,
        allotmentNumber,
        governmentFlow: true,
      });
      res.json(await populatedApplicant(applicant._id));
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

async function allocateManagementQuota(req, res) {
  try {
    const { applicantId, programIntakeId } = req.body;
    const applicant = await allocateSeat({
      applicantId,
      programIntakeId,
      quotaType: 'Management',
      governmentFlow: false,
    });
    res.json(await populatedApplicant(applicant._id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

/** Management *quota* (KCET/COMEDK/Management) — not the `management` user role. */
router.post('/management-quota', authRequired, requireDbRole('admission_officer'), allocateManagementQuota);
/** @deprecated Use POST /management-quota (name avoids confusion with Management user role). */
router.post('/management', authRequired, requireDbRole('admission_officer'), allocateManagementQuota);

router.post(
  '/confirm/:applicantId',
  authRequired,
  requireDbRole('admission_officer'),
  async (req, res) => {
    try {
      const applicant = await confirmAdmission(req.params.applicantId);
      res.json(await populatedApplicant(applicant._id));
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

export default router;
