import { ProgramIntake, QUOTA_TYPES } from '../models/ProgramIntake.js';
import { Applicant } from '../models/Applicant.js';
import { Institution } from '../models/Institution.js';
import { runWithTransaction, nextAdmissionNumber, getInstitutionChain } from '../utils/admissionNumber.js';
import { AcademicYear } from '../models/AcademicYear.js';

function assertQuotaSum(intake) {
  const sum = intake.quotas.reduce((a, q) => a + q.seats, 0);
  if (sum !== intake.totalIntake) {
    throw new Error(`Quota seats (${sum}) must equal total intake (${intake.totalIntake})`);
  }
}

export async function validateIntakePayload(body) {
  const { totalIntake, quotas } = body;
  if (!Array.isArray(quotas) || quotas.length === 0) throw new Error('quotas required');
  const sum = quotas.reduce((a, q) => a + (Number(q.seats) || 0), 0);
  if (sum !== Number(totalIntake)) throw new Error('Sum of quota seats must equal total intake');
  for (const q of quotas) {
    if (!QUOTA_TYPES.includes(q.quotaType)) throw new Error(`Invalid quota type: ${q.quotaType}`);
  }
}

export async function allocateSeat({
  applicantId,
  programIntakeId,
  quotaType,
  allotmentNumber,
  governmentFlow,
}) {
  if (!QUOTA_TYPES.includes(quotaType)) throw new Error('Invalid quota type');

  return runWithTransaction(async (session) => {
    const applicant = await Applicant.findById(applicantId).session(session);
    if (!applicant) throw new Error('Applicant not found');
    if (applicant.admissionStatus !== 'Draft') throw new Error('Applicant already allocated or confirmed');

    const intake = await ProgramIntake.findById(programIntakeId).session(session);
    if (!intake) throw new Error('Program intake not found');
    if (String(intake.programId) !== String(applicant.programId)) {
      throw new Error('Applicant program does not match intake program');
    }
    if (String(intake.academicYearId) !== String(applicant.academicYearId)) {
      throw new Error('Academic year mismatch');
    }

    assertQuotaSum(intake);

    if (governmentFlow) {
      if (quotaType === 'Management') throw new Error('Government flow must use KCET or COMEDK');
      if (!allotmentNumber || !String(allotmentNumber).trim()) {
        throw new Error('Allotment number required for government flow');
      }
      applicant.allotmentNumber = String(allotmentNumber).trim();
    } else {
      if (quotaType !== 'Management') {
        throw new Error('Management admission must use Management quota');
      }
    }

    const slot = intake.quotas.find((q) => q.quotaType === quotaType);
    if (!slot) throw new Error('Quota not configured for this intake');

    const { institution: instBrief } = await getInstitutionChain(intake.programId, session);
    const institution = await Institution.findById(instBrief._id).session(session);

    if (applicant.isJkCategory && institution.jkCapTotal != null) {
      if (institution.jkCapUsed >= institution.jkCapTotal) {
        throw new Error('Institution J&K cap reached');
      }
    }

    let useSuper = false;
    if (slot.filled >= slot.seats) {
      if (intake.supernumeraryTotal > 0 && intake.supernumeraryFilled < intake.supernumeraryTotal) {
        useSuper = true;
      } else {
        throw new Error('Quota full — allocation blocked');
      }
    }

    if (useSuper) {
      intake.supernumeraryFilled += 1;
    } else {
      slot.filled += 1;
    }

    if (applicant.isJkCategory && institution.jkCapTotal != null) {
      institution.jkCapUsed += 1;
      await institution.save({ session });
    }

    applicant.programIntakeId = intake._id;
    applicant.seatLockedQuota = quotaType;
    /** Keep in sync with seat so lists/APIs show the quota actually booked (not stale "preferred" from registration). */
    applicant.quotaType = quotaType;
    applicant.admissionStatus = 'Allocated';
    applicant.allocatedAt = new Date();
    applicant.usesSupernumerary = useSuper;

    await intake.save({ session });
    await applicant.save({ session });

    return applicant;
  });
}

export async function confirmAdmission(applicantId) {
  return runWithTransaction(async (session) => {
    const applicant = await Applicant.findById(applicantId).session(session);
    if (!applicant) throw new Error('Applicant not found');
    if (applicant.admissionStatus !== 'Allocated') {
      throw new Error('Seat must be allocated before confirmation');
    }
    if (applicant.feeStatus !== 'Paid') {
      throw new Error('Fee must be Paid before admission confirmation');
    }
    if (applicant.documentStatus !== 'Verified') {
      throw new Error('Documents must be Verified before confirmation');
    }
    if (applicant.admissionNumber) {
      throw new Error('Admission number already issued');
    }

    const intake = await ProgramIntake.findById(applicant.programIntakeId).session(session);
    if (!intake) throw new Error('Intake not found');

    const { program, institution } = await getInstitutionChain(applicant.programId, session);
    const yearDoc = await AcademicYear.findById(applicant.academicYearId).session(session);
    if (!yearDoc) throw new Error('Academic year not found');

    const number = await nextAdmissionNumber(session, {
      institutionCode: institution.code,
      year: yearDoc.year,
      courseType: program.courseType,
      branchCode: program.branchCode,
      quotaType: applicant.seatLockedQuota,
    });

    applicant.admissionNumber = number;
    applicant.admissionStatus = 'Confirmed';
    await applicant.save({ session });
    return applicant;
  });
}
