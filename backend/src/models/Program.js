import mongoose from 'mongoose';

const COURSE_TYPES = ['UG', 'PG'];
const ENTRY_TYPES = ['Regular', 'Lateral'];
const ADMISSION_MODES = ['Government', 'Management'];

const programSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true, trim: true },
    branchCode: { type: String, required: true, uppercase: true, trim: true },
    courseType: { type: String, enum: COURSE_TYPES, required: true },
    entryType: { type: String, enum: ENTRY_TYPES, required: true },
    admissionMode: { type: String, enum: ADMISSION_MODES, required: true },
  },
  { timestamps: true }
);

programSchema.index({ departmentId: 1, branchCode: 1 });

export const Program = mongoose.model('Program', programSchema);
export { COURSE_TYPES, ENTRY_TYPES, ADMISSION_MODES };
