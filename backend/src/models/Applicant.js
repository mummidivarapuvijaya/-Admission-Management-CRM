import mongoose from 'mongoose';

const CATEGORIES = ['GM', 'SC', 'ST', 'OBC', 'EWS', 'Other'];
const DOC_STATUSES = ['Pending', 'Submitted', 'Verified'];
const FEE_STATUSES = ['Pending', 'Paid'];
const ADMISSION_STATUSES = ['Draft', 'Allocated', 'Confirmed'];

const applicantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, trim: true, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    entryType: { type: String, enum: ['Regular', 'Lateral'], required: true },
    quotaType: { type: String, enum: ['KCET', 'COMEDK', 'Management'], required: true },
    marksPercent: { type: Number, required: true, min: 0, max: 100 },
    qualifyingExam: { type: String, required: true, trim: true },
    allotmentNumber: { type: String, default: '', trim: true },
    isJkCategory: { type: Boolean, default: false },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    programIntakeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramIntake', default: null },
    documentStatus: { type: String, enum: DOC_STATUSES, default: 'Pending' },
    documentFileName: { type: String, trim: true, default: '', maxlength: 512 },
    feeStatus: { type: String, enum: FEE_STATUSES, default: 'Pending' },
    admissionStatus: { type: String, enum: ADMISSION_STATUSES, default: 'Draft' },
    admissionNumber: { type: String },
    seatLockedQuota: { type: String, default: null },
    allocatedAt: { type: Date, default: null },
    usesSupernumerary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

applicantSchema.index({ email: 1, academicYearId: 1 });
applicantSchema.index(
  { admissionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { admissionNumber: { $type: 'string', $gt: '' } },
  }
);

export const Applicant = mongoose.model('Applicant', applicantSchema);
export { CATEGORIES, DOC_STATUSES, FEE_STATUSES, ADMISSION_STATUSES };
