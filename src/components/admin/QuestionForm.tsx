import { useEffect, useState } from 'react';
import { X, Check, Loader2, AlertCircle, Eye } from 'lucide-react';
import type { AdminQuestion, Difficulty, QuestionCategory } from '@/types';

const CATEGORIES: QuestionCategory[] = [
  'General Knowledge',
  'Science',
  'Technology',
  'Sports',
  'History',
  'Geography',
  'Entertainment',
  'Logic',
];

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

interface FormData {
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  category: QuestionCategory;
  difficulty: Difficulty;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  category: 'General Knowledge',
  difficulty: 'easy',
  isActive: true,
};

function validate(form: FormData): string | null {
  if (form.question.trim().length < 4) {
    return 'Question text must be at least 4 characters.';
  }
  const trimmed = form.options.map((o) => o.trim());
  if (trimmed.some((o) => o.length === 0)) {
    return 'All four options must be filled in.';
  }
  const lowered = trimmed.map((o) => o.toLowerCase());
  if (new Set(lowered).size !== 4) {
    return 'Two or more options are identical. Please make them unique.';
  }
  if (form.correctAnswer < 0 || form.correctAnswer > 3) {
    return 'Please select the correct answer.';
  }
  return null;
}

export function QuestionForm({
  open,
  onClose,
  onSubmit,
  editing,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  editing: AdminQuestion | null;
  submitting: boolean;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        question: editing.question,
        options: [
          editing.options[0] ?? '',
          editing.options[1] ?? '',
          editing.options[2] ?? '',
          editing.options[3] ?? '',
        ],
        correctAnswer: editing.correctAnswer,
        category: editing.category,
        difficulty: editing.difficulty,
        isActive: editing.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
    setPreview(false);
  }, [editing, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(form);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    await onSubmit(form);
  };

  const setOption = (i: number, value: string) => {
    setForm((f) => {
      const options = [...f.options] as FormData['options'];
      options[i] = value;
      return { ...f, options };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200 bg-white px-5 py-4 dark:border-ink-800 dark:bg-ink-900">
          <h2 className="font-display text-lg font-bold">
            {editing ? 'Edit Question' : 'Add Question'}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost h-9 w-9 !p-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-error-500/10 px-4 py-3 text-sm font-medium text-error-600 dark:text-error-400 animate-fade-in">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question text */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-500 dark:text-ink-400">
              Question Text
            </label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Enter the question…"
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
            />
            <p className="mt-1 text-[11px] text-ink-400">{form.question.length}/300</p>
          </div>

          {/* Options */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">
              Answer Options (select the correct one)
            </label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, correctAnswer: i }))}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 transition-all ${
                      form.correctAnswer === i
                        ? 'border-success-500 bg-success-500/15 text-success-600'
                        : 'border-ink-200 text-ink-400 hover:border-ink-300 dark:border-ink-700'
                    }`}
                    aria-label={`Mark option ${String.fromCharCode(65 + i)} as correct`}
                  >
                    {form.correctAnswer === i ? <Check size={16} /> : String.fromCharCode(65 + i)}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    maxLength={120}
                    className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category + Difficulty */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-500 dark:text-ink-400">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as QuestionCategory }))
                }
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-500 dark:text-ink-400">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))
                }
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium capitalize outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          {editing && (
            <label className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  form.isActive ? 'bg-success-500' : 'bg-ink-300 dark:bg-ink-700'
                }`}
                role="switch"
                aria-checked={form.isActive}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    form.isActive ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">
                {form.isActive ? 'Active (shown in games)' : 'Inactive (hidden from games)'}
              </span>
            </label>
          )}

          {/* Preview */}
          {preview && (
            <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950">
              <p className="mb-1 text-xs font-semibold text-ink-400">Preview</p>
              <p className="font-display text-base font-bold">
                {form.question || 'Your question will appear here.'}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {form.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      form.correctAnswer === i
                        ? 'bg-success-500/15 text-success-700 font-semibold dark:text-success-300'
                        : 'bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300'
                    }`}
                  >
                    <span className="mr-1.5 font-bold">{String.fromCharCode(65 + i)}.</span>
                    {opt || '—'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="btn-outline"
            >
              <Eye size={16} /> {preview ? 'Hide preview' : 'Preview'}
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {editing ? 'Save changes' : 'Add question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
