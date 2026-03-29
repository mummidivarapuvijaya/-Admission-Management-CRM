import mongoose from 'mongoose';

const ROLES = ['admin', 'admission_officer', 'management'];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
export { ROLES };
