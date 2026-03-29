import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Institution } from './models/Institution.js';
import { Campus } from './models/Campus.js';
import { Department } from './models/Department.js';
import { Program } from './models/Program.js';
import { AcademicYear } from './models/AcademicYear.js';
import { ProgramIntake } from './models/ProgramIntake.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admission_crm';

async function seed() {
  await connectDb(uri);
  await User.deleteMany({ email: { $in: ['admin@demo.edu', 'officer@demo.edu', 'mgmt@demo.edu'] } });

  const hash = await bcrypt.hash('Demo@123', 10);
  await User.create([
    { email: 'admin@demo.edu', passwordHash: hash, name: 'Demo Admin', role: 'admin' },
    { email: 'officer@demo.edu', passwordHash: hash, name: 'Demo Officer', role: 'admission_officer' },
    { email: 'mgmt@demo.edu', passwordHash: hash, name: 'Demo Management', role: 'management' },
  ]);

  let inst = await Institution.findOne({ code: 'INST' });
  if (!inst) {
    inst = await Institution.create({ name: 'Demo University', code: 'INST', jkCapTotal: 10, jkCapUsed: 0 });
  }

  let campus = await Campus.findOne({ institutionId: inst._id, code: 'MAIN' });
  if (!campus) {
    campus = await Campus.create({ institutionId: inst._id, name: 'Main Campus', code: 'MAIN' });
  }

  let dept = await Department.findOne({ campusId: campus._id, code: 'CSE' });
  if (!dept) {
    dept = await Department.create({ campusId: campus._id, name: 'Computer Science', code: 'CSE' });
  }

  let program = await Program.findOne({ departmentId: dept._id, branchCode: 'CSE' });
  if (!program) {
    program = await Program.create({
      departmentId: dept._id,
      name: 'B.Tech Computer Science',
      branchCode: 'CSE',
      courseType: 'UG',
      entryType: 'Regular',
      admissionMode: 'Government',
    });
  }

  let year = await AcademicYear.findOne({ year: 2026 });
  if (!year) {
    year = await AcademicYear.create({ label: '2026-27', year: 2026, isActive: true });
  }

  let intake = await ProgramIntake.findOne({ programId: program._id, academicYearId: year._id });
  if (!intake) {
    intake = await ProgramIntake.create({
      programId: program._id,
      academicYearId: year._id,
      totalIntake: 100,
      quotas: [
        { quotaType: 'KCET', seats: 40, filled: 0 },
        { quotaType: 'COMEDK', seats: 30, filled: 0 },
        { quotaType: 'Management', seats: 30, filled: 0 },
      ],
      supernumeraryTotal: 5,
      supernumeraryFilled: 0,
    });
  }

  console.log('Seed complete.');
  console.log('Users (password Demo@123):');
  console.log('  admin@demo.edu (admin)');
  console.log('  officer@demo.edu (admission_officer)');
  console.log('  mgmt@demo.edu (management)');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
