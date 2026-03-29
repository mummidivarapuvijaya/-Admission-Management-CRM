import mongoose from 'mongoose';

const admissionCounterSchema = new mongoose.Schema(
  {
    institutionCode: { type: String, required: true },
    year: { type: Number, required: true },
    courseType: { type: String, required: true },
    branchCode: { type: String, required: true },
    quotaType: { type: String, required: true },
    lastSerial: { type: Number, default: 0 },
  },
  { timestamps: true }
);

admissionCounterSchema.index(
  { institutionCode: 1, year: 1, courseType: 1, branchCode: 1, quotaType: 1 },
  { unique: true }
);

export const AdmissionCounter = mongoose.model('AdmissionCounter', admissionCounterSchema);
