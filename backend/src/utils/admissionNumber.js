import mongoose from 'mongoose';
import { AdmissionCounter } from '../models/AdmissionCounter.js';

export async function nextAdmissionNumber(session, { institutionCode, year, courseType, branchCode, quotaType }) {
  const filter = { institutionCode, year, courseType, branchCode, quotaType };
  const updated = await AdmissionCounter.findOneAndUpdate(
    filter,
    { $inc: { lastSerial: 1 } },
    { new: true, upsert: true, session }
  );
  const serial = String(updated.lastSerial).padStart(4, '0');
  return `${institutionCode}/${year}/${courseType}/${branchCode}/${quotaType}/${serial}`;
}

export async function getInstitutionChain(programId, session = null) {
  const { Program } = await import('../models/Program.js');
  const { Department } = await import('../models/Department.js');
  const { Campus } = await import('../models/Campus.js');
  const { Institution } = await import('../models/Institution.js');

  const q = Program.findById(programId).session(session);
  const program = await q;
  if (!program) throw new Error('Program not found');
  const dept = await Department.findById(program.departmentId).session(session);
  if (!dept) throw new Error('Department not found');
  const campus = await Campus.findById(dept.campusId).session(session);
  if (!campus) throw new Error('Campus not found');
  const institution = await Institution.findById(campus.institutionId).session(session);
  if (!institution) throw new Error('Institution not found');
  return { program, institution };
}

export function runWithTransaction(fn) {
  return mongoose.startSession().then(async (session) => {
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  });
}
