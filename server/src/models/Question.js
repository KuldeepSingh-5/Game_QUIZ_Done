import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, minlength: 4 },
    options: {
      type: [String],
      required: true,
      validate: [(v) => v.length === 4, 'Must have exactly 4 options'],
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    category: {
      type: String,
      required: true,
      enum: ['Math', 'Logic', 'Words', 'Science', 'Trivia', 'Patterns'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
    },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, difficulty: 1 });

export const Question = mongoose.model('Question', questionSchema);
