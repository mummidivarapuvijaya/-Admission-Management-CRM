import mongoose from 'mongoose';

const campusSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

campusSchema.index({ institutionId: 1, code: 1 }, { unique: true });

export const Campus = mongoose.model('Campus', campusSchema);
