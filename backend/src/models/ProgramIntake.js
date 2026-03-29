import mongoose from 'mongoose';

const QUOTA_TYPES = ['KCET', 'COMEDK', 'Management'];

const quotaSlotSchema = new mongoose.Schema(
  {
    quotaType: { type: String, enum: QUOTA_TYPES, required: true },
    seats: { type: Number, required: true, min: 0 },
    filled: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const programIntakeSchema = new mongoose.Schema(
  {
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    totalIntake: { type: Number, required: true, min: 1 },
    quotas: { type: [quotaSlotSchema], required: true },
    supernumeraryTotal: { type: Number, default: 0, min: 0 },
    supernumeraryFilled: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

programIntakeSchema.index({ programId: 1, academicYearId: 1 }, { unique: true });

programIntakeSchema.methods.getQuota = function getQuota(quotaType) {
  return this.quotas.find((q) => q.quotaType === quotaType);
};

export const ProgramIntake = mongoose.model('ProgramIntake', programIntakeSchema);
export { QUOTA_TYPES };
