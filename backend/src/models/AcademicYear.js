import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

academicYearSchema.index({ year: 1 }, { unique: true });

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
