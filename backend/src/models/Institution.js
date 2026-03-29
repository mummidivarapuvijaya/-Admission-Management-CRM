import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    jkCapTotal: { type: Number, default: null },
    jkCapUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Institution = mongoose.model('Institution', institutionSchema);
