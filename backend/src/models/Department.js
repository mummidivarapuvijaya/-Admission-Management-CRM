import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

departmentSchema.index({ campusId: 1, code: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);
