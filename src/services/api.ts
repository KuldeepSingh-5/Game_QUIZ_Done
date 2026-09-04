import { supabase } from '@/lib/supabase';
import type {
  AdminQuestion,
  AdminQuestionListResult,
  AdminStats,
  CheckAnswerResult,
  GameQuestion,
  GameResult,
  LeaderboardEntry,
  Question,
  SubmitGameResult,
  UserStats,
} from '@/types';
import { getTodayDateString } from '@/utils/streak';

const GUEST_ID_KEY = 'dc_guest_player_id';
const STATS_CACHE_KEY = 'dc_user_stats';

const DEFAULT_USER: UserStats = {
  username: 'Guest',
  xp: 0,
  level: 1,
  streak: 0,
  highestScore: 0,
  lastPlayedDate: null,
  todayBestScore: 0,
  todayDate: null,
  totalGamesPlayed: 0,
  totalCorrectAnswers: 0,
};

function getGuestPlayerId(): string | null {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch {
    return null;
  }
}

function setGuestPlayerId(id: string): void {
  try {
    localStorage.setItem(GUEST_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

function writeStatsCache(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

function readStatsCache(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

function mapPlayerToStats(p: Record<string, unknown>): UserStats {
  return {
    username: p.username as string,
    xp: (p.xp as number) ?? 0,
    level: (p.level as number) ?? 1,
    streak: (p.streak as number) ?? 0,
    highestScore: (p.highest_score as number) ?? 0,
    lastPlayedDate: (p.last_played_date as string) ?? null,
    todayBestScore: (p.today_best_score as number) ?? 0,
    todayDate: (p.today_date as string) ?? null,
    totalGamesPlayed: (p.total_games as number) ?? 0,
    totalCorrectAnswers: (p.total_correct_answers as number) ?? 0,
  };
}

function mapSubmitResultToStats(r: SubmitGameResult): UserStats {
  return {
    username: r.username,
    xp: r.xp,
    level: r.level,
    streak: r.streak,
    highestScore: r.highestScore,
    lastPlayedDate: r.lastPlayedDate,
    todayBestScore: r.todayBestScore,
    todayDate: r.todayDate,
    totalGamesPlayed: r.totalGames,
    totalCorrectAnswers: r.totalCorrectAnswers,
  };
}

function mapSubmitRpcRow(row: Record<string, unknown>): SubmitGameResult {
  return {
    playerId: String(row.player_id ?? row.playerId ?? ''),
    username: String(row.username ?? ''),
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    streak: Number(row.streak ?? 0),
    highestScore: Number(row.highest_score ?? row.highestScore ?? 0),
    lastPlayedDate: String(row.last_played_date ?? row.lastPlayedDate ?? ''),
    todayBestScore: Number(row.today_best_score ?? row.todayBestScore ?? 0),
    todayDate: String(row.today_date ?? row.todayDate ?? ''),
    totalGames: Number(row.total_games ?? row.totalGames ?? 0),
    totalCorrectAnswers: Number(
      row.total_correct_answers ?? row.totalCorrectAnswers ?? 0
    ),
    score: Number(row.score ?? 0),
    xpEarned: Number(row.xp_earned ?? row.xpEarned ?? 0),
    gameResultId: String(row.game_result_id ?? row.gameResultId ?? '') || null,
  };
}

function isUuid(value: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function randomGuestName(): string {
  const adjectives = ['Swift', 'Bright', 'Clever', 'Bold', 'Calm', 'Keen', 'Wise', 'Quick'];
  const nouns = ['Fox', 'Owl', 'Hawk', 'Bear', 'Wolf', 'Cat', 'Raven', 'Lion'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${a}${n}${num}`;
}

async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/**
 * Creates or retrieves a player profile for a registered (authenticated) user.
 */
export async function ensurePlayerProfile(
  authUserId: string,
  email: string,
  username?: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (existing) return existing.id;

  const name = username || email.split('@')[0].slice(0, 20) || 'Player';

  const { data, error } = await supabase
    .from('players')
    .insert({ username: name, user_id: authUserId, email })
    .select('id')
    .single();

  if (error || !data) {
    const retryName = `${name}${Math.floor(Math.random() * 999)}`;
    const { data: retryData, error: retryErr } = await supabase
      .from('players')
      .insert({ username: retryName, user_id: authUserId, email })
      .select('id')
      .single();

    if (retryErr || !retryData) {
      throw new Error('Could not create player profile');
    }
    return retryData.id;
  }

  return data.id;
}

/**
 * Returns the player ID for the current session.
 * - Authenticated user: returns their linked player profile ID.
 * - Guest: creates/retrieves a temporary guest player profile.
 */
export async function resolvePlayerId(): Promise<{ playerId: string; isGuest: boolean }> {
  const authUserId = await getAuthUserId();

  if (authUserId) {
    const { data } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (data) return { playerId: data.id, isGuest: false };

    const { data: authUser } = await supabase.auth.getUser();
    const email = authUser.user?.email ?? '';
    const id = await ensurePlayerProfile(authUserId, email);
    return { playerId: id, isGuest: false };
  }

  const existing = getGuestPlayerId();
  if (existing) return { playerId: existing, isGuest: true };

  const username = randomGuestName();
  const { data, error } = await supabase
    .from('players')
    .insert({ username })
    .select('id')
    .single();

  if (error || !data) throw new Error('Could not create guest player');
  setGuestPlayerId(data.id);
  return { playerId: data.id, isGuest: true };
}

/** Whether the current authenticated user has the admin role. */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/** Translates a database error/message into a friendly string. */
function friendlyError(err: { message?: string } | null, fallback: string): string {
  if (!err || !err.message) return fallback;
  const m = err.message.toLowerCase();
  if (m.includes('not authorized')) return 'You do not have permission to do this.';
  if (m.includes('exactly 4 options')) return 'Exactly 4 answer options are required.';
  if (m.includes('duplicate option')) return 'Two or more options are identical.';
  if (m.includes('invalid category')) return 'Please choose a valid category.';
  if (m.includes('invalid difficulty')) return 'Please choose a valid difficulty.';
  if (m.includes('correct answer index')) return 'Please select the correct answer.';
  if (m.includes('question text is required')) return 'Question text cannot be empty.';
  if (m.includes('too short')) return 'Question text is too short (min 4 characters).';
  if (m.includes('option')) return 'All four options must be filled in.';
  if (m.includes('question not found')) return 'That question no longer exists.';
  if (m.includes('correct exceeds attempts')) return 'Correct answers cannot exceed attempts.';
  if (m.includes('player not found')) return 'Your player profile could not be found.';
  return fallback;
}

export const api = {
  // ---------- Game (server-validated) ----------

  async getQuestions(): Promise<GameQuestion[]> {
    const { data, error } = await supabase.rpc('fetch_game_questions', { p_count: 40 });
    if (error) throw new Error('Could not load questions');
    if (!data || data.length === 0) throw new Error('No questions available');

    return (data as GameQuestion[]).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category as Question['category'],
      difficulty: q.difficulty as Question['difficulty'],
    }));
  },

  async checkAnswer(questionId: string, selectedIndex: number): Promise<CheckAnswerResult> {
    const { data, error } = await supabase.rpc('check_answer', {
      p_question_id: questionId,
      p_selected_index: selectedIndex,
    });
    if (error || !data) {
      throw new Error('Could not verify answer');
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      correct: Boolean(row.correct),
      correctAnswer: Number(row.correct_answer),
    };
  },

  async submitGame(result: {
    correctAnswers: number;
    attemptedQuestions: number;
  }): Promise<{ stats: UserStats; result: GameResult; isGuest: boolean }> {
    const { playerId, isGuest } = await resolvePlayerId();

    const { data, error } = await supabase.rpc('submit_game', {
      p_correct: result.correctAnswers,
      p_attempted: result.attemptedQuestions,
      p_player_id: playerId,
    });

    if (error || !data) {
      throw new Error(friendlyError(error, 'Could not submit your game. Please try again.'));
    }

    const rawRow = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    const row = mapSubmitRpcRow(rawRow);

    // Older deployed submit_game functions inserted the row but did not return its ID.
    // Recover that existing row rather than creating a second game result.
    if (!isUuid(row.gameResultId)) {
      const { data: savedResult, error: savedResultError } = await supabase
        .from('game_results')
        .select('id')
        .eq('player_id', playerId)
        .eq('score', row.score)
        .eq('correct_answers', result.correctAnswers)
        .eq('attempted', result.attemptedQuestions)
        .eq('xp_earned', row.xpEarned)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!savedResultError && savedResult?.id) {
        row.gameResultId = savedResult.id;
      }
    }

    if (!isUuid(row.gameResultId)) {
      throw new Error('Game submission did not return a game result ID. Please try again.');
    }
    const stats = mapSubmitResultToStats(row);
    writeStatsCache(stats);

    return {
      stats,
      result: {
        id: row.gameResultId,
        score: row.score,
        correctAnswers: result.correctAnswers,
        attemptedQuestions: result.attemptedQuestions,
        xpEarned: row.xpEarned,
        date: row.todayDate,
        createdAt: new Date().toISOString(),
      },
      isGuest,
    };
  },

  // ---------- Player stats ----------

  async getUserStats(): Promise<UserStats> {
    try {
      const { playerId } = await resolvePlayerId();
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (error || !data) return readStatsCache();

      const stats = mapPlayerToStats(data);
      writeStatsCache(stats);
      return stats;
    } catch {
      return readStatsCache();
    }
  },

  // ---------- Leaderboard ----------

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('players')
      .select('id, username, highest_score, xp, streak')
      .order('highest_score', { ascending: false })
      .order('xp', { ascending: false })
      .limit(50);

    if (error) throw new Error('Could not load leaderboard');

    return (data ?? []).map((e, i) => ({
      rank: i + 1,
      username: e.username,
      score: e.highest_score ?? 0,
      xp: e.xp ?? 0,
      streak: e.streak ?? 0,
      playerId: e.id,
    }));
  },

  async getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
    const today = getTodayDateString();
    const { data, error } = await supabase
      .from('game_results')
      .select('score, xp_earned, date, players!player_id(id, username, streak)')
      .eq('date', today)
      .order('score', { ascending: false })
      .limit(50);

    if (error) throw new Error('Could not load daily leaderboard');

    const bestByPlayer = new Map<string, LeaderboardEntry>();
    for (const r of data ?? []) {
      const player = r.players as unknown as Record<string, unknown>;
      const playerDbId = (player?.id as string) ?? '';
      const playerName = (player?.username as string) ?? 'Player';
      const playerStreak = (player?.streak as number) ?? 0;
      const existing = bestByPlayer.get(playerDbId);
      if (!existing || r.score > existing.score) {
        bestByPlayer.set(playerDbId, {
          rank: 0,
          username: playerName,
          score: r.score,
          xp: r.xp_earned,
          streak: playerStreak,
          playerId: playerDbId,
        });
      }
    }

    const entries = Array.from(bestByPlayer.values()).sort((a, b) => b.score - a.score);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  },

  // ---------- Admin: stats ----------

  async getAdminStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc('admin_stats');

    if (error || !data) {
      throw new Error(friendlyError(error, 'Could not load admin stats.'));
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, number>;

    return {
      totalQuestions: Number(row.total_questions ?? 0),
      activeQuestions: Number(row.active_questions ?? 0),
      totalPlayers: Number(row.total_players ?? 0),
      registeredPlayers: Number(row.registered_players ?? 0),
      totalGames: Number(row.total_games ?? 0),
      gamesToday: Number(row.games_today ?? 0),
      topScore: Number(row.top_score ?? 0),
    };
  },

  // ---------- Admin: questions ----------

  async listAdminQuestions(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    category?: string;
    difficulty?: string;
    activeOnly?: boolean | null;
  }): Promise<AdminQuestionListResult> {
    const rpcParams: Record<string, unknown> = {
      p_limit: params?.limit ?? 25,
      p_offset: params?.offset ?? 0,
    };

    if (params?.search) rpcParams.p_search = params.search;
    if (params?.category) rpcParams.p_category = params.category;
    if (params?.difficulty) rpcParams.p_difficulty = params.difficulty;

    if (
      params?.activeOnly !== undefined &&
      params?.activeOnly !== null
    ) {
      rpcParams.p_active_only = params.activeOnly;
    }

    const { data, error } = await supabase.rpc(
      'admin_list_questions',
      rpcParams
    );

    if (error || !data) {
      throw new Error(friendlyError(error, 'Could not load questions.'));
    }

    const rows = (
      Array.isArray(data) ? data : [data]
    ) as Record<string, unknown>[];

    const items: AdminQuestion[] = rows.map((q) => ({
      id: q.id as string,
      question: q.question as string,
      options: q.options as string[],
      correctAnswer: Number(q.correct_answer),
      category: q.category as Question['category'],
      difficulty: q.difficulty as Question['difficulty'],
      isActive: Boolean(q.is_active),
      createdAt: q.created_at as string,
      updatedAt: q.updated_at as string,
    }));

    const total =
      rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0;

    return { items, total };
  },

  async createQuestion(input: {
    question: string;
    options: string[];
    correctAnswer: number;
    category: string;
    difficulty: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc(
      'admin_create_question',
      {
        p_question: input.question,
        p_options: input.options,
        p_correct_answer: input.correctAnswer,
        p_category: input.category,
        p_difficulty: input.difficulty,
      }
    );

    if (error || !data) {
      throw new Error(
        friendlyError(error, 'Could not create the question.')
      );
    }

    return data as string;
  },

  async updateQuestion(input: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    category: string;
    difficulty: string;
    isActive: boolean;
  }): Promise<string> {
    const { data, error } = await supabase.rpc(
      'admin_update_question',
      {
        p_id: input.id,
        p_question: input.question,
        p_options: input.options,
        p_correct_answer: input.correctAnswer,
        p_category: input.category,
        p_difficulty: input.difficulty,
        p_is_active: input.isActive,
      }
    );

    if (error || !data) {
      throw new Error(
        friendlyError(error, 'Could not update the question.')
      );
    }

    return data as string;
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase.rpc(
      'admin_delete_question',
      {
        p_id: id,
      }
    );

    if (error) {
      throw new Error(
        friendlyError(error, 'Could not delete the question.')
      );
    }
  },

  async toggleQuestion(
    id: string,
    isActive: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc(
      'admin_toggle_question',
      {
        p_id: id,
        p_is_active: isActive,
      }
    );

    if (error) {
      throw new Error(
        friendlyError(
          error,
          'Could not change the question status.'
        )
      );
    }
  },
};
