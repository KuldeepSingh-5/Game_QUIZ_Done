export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionCategory =
  | 'General Knowledge'
  | 'Science'
  | 'Technology'
  | 'Sports'
  | 'History'
  | 'Geography'
  | 'Entertainment'
  | 'Logic';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: QuestionCategory;
  difficulty: Difficulty;
}

/** Question as returned by fetch_game_questions (no correct answer). */
export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  category: QuestionCategory;
  difficulty: Difficulty;
}

export interface GameResult {
  id: string;
  score: number;
  correctAnswers: number;
  attemptedQuestions: number;
  xpEarned: number;
  date: string;
  createdAt: string;
}

export interface UserStats {
  username: string;
  xp: number;
  level: number;
  streak: number;
  highestScore: number;
  lastPlayedDate: string | null;
  todayBestScore: number;
  todayDate: string | null;
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  xp: number;
  playerId: string | null;
  streak: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type Theme = 'light' | 'dark';

// ---- Admin types ----

export interface AdminQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: QuestionCategory;
  difficulty: Difficulty;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalQuestions: number;
  activeQuestions: number;
  totalPlayers: number;
  registeredPlayers: number;
  totalGames: number;
  gamesToday: number;
  topScore: number;
}

export interface AdminQuestionListResult {
  items: AdminQuestion[];
  total: number;
}

export interface CheckAnswerResult {
  correct: boolean;
  correctAnswer: number;
}

export interface SubmitGameResult {
  playerId: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  highestScore: number;
  lastPlayedDate: string;
  todayBestScore: number;
  todayDate: string;
  totalGames: number;
  totalCorrectAnswers: number;
  score: number;
  xpEarned: number;
  gameResultId: string | null;
}
