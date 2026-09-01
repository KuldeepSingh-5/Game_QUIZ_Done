import { z } from 'zod';

export function validate(schema, location = 'body') {
  return (req, res, next) => {
    const data = req[location];
    const result = schema.safeParse(data);
    if (!result.success) {
      const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    req.validated = result.data;
    next();
  };
}

export const schemas = {
  register: z.object({
    username: z.string().min(2).max(20),
    email: z.string().email(),
    password: z.string().min(6).max(72),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  submitGame: z.object({
    score: z.number().int().min(0).max(1000),
    correctAnswers: z.number().int().min(0).max(100),
    attemptedQuestions: z.number().int().min(0).max(100),
    xpEarned: z.number().int().min(0).max(500),
    durationMs: z.number().int().min(1000).max(120000).optional(),
  }),
  createQuestion: z.object({
    question: z.string().min(4).max(300),
    options: z.array(z.string().min(1).max(120)).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    category: z.enum(['Math', 'Logic', 'Words', 'Science', 'Trivia', 'Patterns']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
  updateQuestion: z.object({
    question: z.string().min(4).max(300).optional(),
    options: z.array(z.string().min(1).max(120)).length(4).optional(),
    correctAnswer: z.number().int().min(0).max(3).optional(),
    category: z.enum(['Math', 'Logic', 'Words', 'Science', 'Trivia', 'Patterns']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  }),
};
