import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1, max: 5 },
    streak: { type: Number, default: 0, min: 0 },
    highestScore: { type: Number, default: 0, min: 0 },
    lastPlayedDate: { type: String, default: null },
    todayBestScore: { type: Number, default: 0, min: 0 },
    todayDate: { type: String, default: null },
    totalGamesPlayed: { type: Number, default: 0, min: 0 },
    isGuest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ xp: -1 });
userSchema.index({ highestScore: -1 });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
