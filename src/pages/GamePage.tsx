import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Timer } from '@/components/Timer';
import { QuestionCard } from '@/components/QuestionCard';
import { ErrorState } from '@/components/ErrorState';
import { api } from '@/services/api';
import type { GameQuestion } from '@/types';

const GAME_DURATION = 60;
const FEEDBACK_MS = 700;

export interface GameOutcome {
  score: number;
  correctAnswers: number;
  attemptedQuestions: number;
  xpEarned: number;
  gameResultId: string | null;
}

export function GamePage({
  onFinish,
  onExit,
}: {
  onFinish: (outcome: GameOutcome) => void;
  onExit: () => void;
}) {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(GAME_DURATION);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = await api.getQuestions();
      if (!q.length) throw new Error('No questions available');
      setQuestions(q);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!started || ended) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setEnded(true);
          setLocked(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, ended]);

  useEffect(() => {
    if (!ended) return;
    const submit = async () => {
      try {
        const { result } = await api.submitGame({
          correctAnswers: correct,
          attemptedQuestions: attempted,
        });
        const outcome: GameOutcome = {
          score: result.score,
          correctAnswers: result.correctAnswers,
          attemptedQuestions: result.attemptedQuestions,
          xpEarned: result.xpEarned,
          gameResultId: result.id,
        };
        onFinish(outcome);
      } catch {
        // Fall back to client-calculated values if server is unreachable
        const score = correct * 10;
        const xpEarned = correct * 10 + Math.floor(score / 2);
        onFinish({
          score,
          correctAnswers: correct,
          attemptedQuestions: attempted,
          xpEarned,
          gameResultId: null,
        });
      }
    };
    const t = setTimeout(submit, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  const current = questions[index];

  const handleSelect = useCallback(
    async (i: number) => {
      if (locked || !current || ended) return;
      setSelected(i);
      setLocked(true);
      setAttempted((a) => a + 1);

      try {
        const result = await api.checkAnswer(current.id, i);
        setRevealedAnswer(result.correctAnswer);
        if (result.correct) {
          setCorrect((c) => c + 1);
        }
      } catch {
        // If the server is unreachable, we can't verify — don't count it.
        setRevealedAnswer(null);
      }

      setTimeout(() => {
        setSelected(null);
        setRevealedAnswer(null);
        if (index >= questions.length - 1) {
          setEnded(true);
          setLocked(true);
          return;
        }
        setLocked(false);
        setIndex((idx) => idx + 1);
      }, FEEDBACK_MS);
    },
    [locked, current, ended, index, questions.length]
  );

  const startGame = useCallback(() => {
    setStarted(true);
    setSecondsLeft(GAME_DURATION);
    setIndex(0);
    setCorrect(0);
    setAttempted(0);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-10">
        <ErrorState
          title="Couldn't load the game"
          message="We couldn't fetch questions right now. Check your connection and try again."
          onRetry={loadQuestions}
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 md:pb-10">
        <button onClick={onExit} className="btn-ghost mb-4 h-10 w-10 !p-0">
          <ArrowLeft size={18} />
        </button>
        <div className="card animate-pop-in p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary-500/15 text-primary-500">
            <span className="font-display text-2xl font-extrabold">60</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold">Ready to play?</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500 dark:text-ink-400">
            You'll have 60 seconds to answer as many questions as possible. Each correct answer earns 10 points and 10 XP. Good luck!
          </p>
          <button onClick={startGame} className="btn-primary mt-6 w-full animate-pulse-ring">
            Start now
          </button>
        </div>
      </div>
    );
  }

  const liveScore = correct * 10;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 md:pb-10">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExit} className="btn-ghost h-10 w-10 !p-0" aria-label="Exit game">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <Timer secondsLeft={secondsLeft} total={GAME_DURATION} />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl bg-ink-100 px-4 py-2.5 dark:bg-ink-900">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-ink-500 dark:text-ink-400">Score</span>
          <span className="font-display text-xl font-extrabold text-primary-500 tabular-nums">{liveScore}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-ink-500 dark:text-ink-400">Correct</span>
          <span className="font-display text-xl font-extrabold text-success-500 tabular-nums">{correct}</span>
        </div>
      </div>

      {current ? (
        <QuestionCard
          key={current.id}
          question={current}
          index={index}
          total={attempted + 1}
          selected={selected}
          locked={locked}
          correctAnswerIndex={revealedAnswer}
          onSelect={handleSelect}
        />
      ) : (
        <div className="card p-8 text-center animate-fade-in">
          <p className="text-sm text-ink-500 dark:text-ink-400">That's all the questions we have. Finishing up…</p>
        </div>
      )}
    </div>
  );
}
