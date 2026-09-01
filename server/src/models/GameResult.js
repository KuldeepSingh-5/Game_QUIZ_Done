import mongoose from 'mongoose';

const gameResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 0 },
    correctAnswers: { type: Number, required: true, min: 0 },
    attemptedQuestions: { type: Number, required: true, min: 0 },
    xpEarned: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

gameResultSchema.index({ userId: 1, date: -1 });
gameResultSchema.index({ score: -1 });
gameResultSchema.index({ date: -1 });

export const GameResult = mongoose.model('GameResult', gameResultSchema);
