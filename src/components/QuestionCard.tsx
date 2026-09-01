import { Check, X } from 'lucide-react';
import type { GameQuestion } from '@/types';

export function QuestionCard({
  question,
  index,
  total,
  selected,
  locked,
  correctAnswerIndex,
  onSelect,
}: {
  question: GameQuestion;
  index: number;
  total: number;
  selected: number | null;
  locked: boolean;
  correctAnswerIndex: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="card animate-slide-up p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="chip bg-primary-500/10 text-primary-600 dark:text-primary-300">{question.category}</span>
          <span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300 capitalize">{question.difficulty}</span>
        </div>
        <span className="text-xs font-semibold text-ink-400 dark:text-ink-500">Q {index + 1} / {total}</span>
      </div>

      <h2 className="mb-5 font-display text-xl font-bold leading-snug sm:text-2xl">
        {question.question}
      </h2>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const isCorrect = correctAnswerIndex !== null && i === correctAnswerIndex;
          const isSelected = selected === i;
          let cls = 'btn-ghost justify-start text-left';
          if (locked && isCorrect) cls = 'btn justify-start text-left bg-success-500 text-white hover:bg-success-500';
          else if (locked && isSelected && !isCorrect) cls = 'btn justify-start text-left bg-error-500 text-white hover:bg-error-500 animate-shake';
          else if (locked) cls = 'btn-ghost justify-start text-left opacity-60';
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => onSelect(i)}
              className={`${cls} relative px-4 py-3.5 text-base`}
            >
              <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black/5 text-xs font-bold dark:bg-white/10">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {locked && isCorrect && <Check size={18} className="ml-auto" />}
              {locked && isSelected && !isCorrect && <X size={18} className="ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
