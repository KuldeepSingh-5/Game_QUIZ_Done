import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { AdminQuestion, Difficulty, QuestionCategory } from '@/types';
import { api } from '@/services/api';
import { ErrorState } from '@/components/ErrorState';
import { QuestionForm } from '@/components/admin/QuestionForm';

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
const PAGE_SIZE = 25;

export function AdminQuestions() {
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminQuestion | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await api.listAdminQuestions({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        difficulty: difficultyFilter || undefined,
        activeOnly:
          activeFilter === '' ? null : activeFilter === 'active' ? true : false,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, difficultyFilter, activeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [search, categoryFilter, difficultyFilter, activeFilter]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (q: AdminQuestion) => {
    setEditing(q);
    setFormOpen(true);
  };

  const handleSubmit = async (data: {
    question: string;
    options: [string, string, string, string];
    correctAnswer: number;
    category: QuestionCategory;
    difficulty: Difficulty;
    isActive: boolean;
  }) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateQuestion({
          id: editing.id,
          question: data.question.trim(),
          options: data.options.map((o) => o.trim()),
          correctAnswer: data.correctAnswer,
          category: data.category,
          difficulty: data.difficulty,
          isActive: data.isActive,
        });
        showToast('ok', 'Question updated.');
      } else {
        await api.createQuestion({
          question: data.question.trim(),
          options: data.options.map((o) => o.trim()),
          correctAnswer: data.correctAnswer,
          category: data.category,
          difficulty: data.difficulty,
        });
        showToast('ok', 'Question added.');
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (q: AdminQuestion) => {
    setActionId(q.id);
    try {
      await api.toggleQuestion(q.id, !q.isActive);
      setItems((prev) =>
        prev.map((it) => (it.id === q.id ? { ...it, isActive: !it.isActive } : it))
      );
      showToast('ok', q.isActive ? 'Question disabled.' : 'Question enabled.');
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Could not change status.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    try {
      await api.deleteQuestion(confirmDelete.id);
      showToast('ok', 'Question deleted.');
      setConfirmDelete(null);
      await load();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Questions</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {total} total question{total === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary w-full sm:w-auto">
          <Plus size={18} /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium capitalize outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d} className="capitalize">
              {d}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
        >
          <option value="">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {/* Table / list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load questions"
          message="We couldn't fetch the question list. Please try again."
          onRetry={load}
        />
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No questions match your filters. Try adjusting them or add a new question.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <div className="grid grid-cols-12 gap-2 border-b border-ink-200 bg-ink-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-400">
              <span className="col-span-4">Question</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-1">Difficulty</span>
              <span className="col-span-1">Correct</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {items.map((q) => (
                <div
                  key={q.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/40"
                >
                  <span className="col-span-4 truncate text-sm font-medium">
                    {q.question}
                  </span>
                  <span className="col-span-2 truncate text-sm text-ink-500 dark:text-ink-400">
                    {q.category}
                  </span>
                  <span className="col-span-1 text-sm capitalize text-ink-500 dark:text-ink-400">
                    {q.difficulty}
                  </span>
                  <span className="col-span-1 text-sm font-semibold">
                    {String.fromCharCode(65 + q.correctAnswer)}
                  </span>
                  <span className="col-span-1">
                    {q.isActive ? (
                      <span className="chip bg-success-500/15 text-success-600 dark:text-success-400">
                        <CheckCircle size={11} /> Active
                      </span>
                    ) : (
                      <span className="chip bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                        <XCircle size={11} /> Off
                      </span>
                    )}
                  </span>
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleToggle(q)}
                      disabled={actionId === q.id}
                      className="btn-ghost h-8 px-3 text-xs"
                      title={q.isActive ? 'Disable' : 'Enable'}
                    >
                      {actionId === q.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Power size={13} />
                      )}
                      <span className="hidden xl:inline">
                        {q.isActive ? 'Disable' : 'Enable'}
                      </span>
                    </button>
                    <button
                      onClick={() => openEdit(q)}
                      className="btn-ghost h-8 px-3 text-xs"
                      title="Edit"
                    >
                      <Pencil size={13} /> <span className="hidden xl:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(q)}
                      disabled={actionId === q.id}
                      className="btn-ghost h-8 px-3 text-xs text-error-600 dark:text-error-400"
                      title="Delete"
                    >
                      <Trash2 size={13} /> <span className="hidden xl:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {items.map((q) => (
              <div key={q.id} className="card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{q.question}</p>
                  {q.isActive ? (
                    <span className="chip shrink-0 bg-success-500/15 text-success-600 dark:text-success-400">
                      Active
                    </span>
                  ) : (
                    <span className="chip shrink-0 bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                      Off
                    </span>
                  )}
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="chip bg-primary-500/10 text-primary-600 dark:text-primary-300">
                    {q.category}
                  </span>
                  <span className="chip bg-ink-100 text-ink-600 capitalize dark:bg-ink-800 dark:text-ink-300">
                    {q.difficulty}
                  </span>
                  <span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    Answer: {String.fromCharCode(65 + q.correctAnswer)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(q)}
                    disabled={actionId === q.id}
                    className="btn-ghost flex-1 py-2 text-xs"
                  >
                    {actionId === q.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Power size={13} />
                    )}
                    {q.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => openEdit(q)}
                    className="btn-ghost flex-1 py-2 text-xs"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(q)}
                    disabled={actionId === q.id}
                    className="btn-ghost flex-1 py-2 text-xs text-error-600 dark:text-error-400"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-ink-500 dark:text-ink-400">
                Page {page + 1} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit modal */}
      <QuestionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        editing={editing}
        submitting={submitting}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-pop-in">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-error-500/15 text-error-500">
                <Trash2 size={22} />
              </div>
              <h3 className="font-display text-lg font-bold">Delete question?</h3>
            </div>
            <p className="mb-1 text-sm text-ink-500 dark:text-ink-400">
              This will permanently remove the question:
            </p>
            <p className="mb-5 rounded-lg bg-ink-50 p-3 text-sm font-medium dark:bg-ink-950">
              {confirmDelete.question}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionId === confirmDelete.id}
                className="btn bg-error-500 px-5 py-3 text-white hover:bg-error-600"
              >
                {actionId === confirmDelete.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-card ${
              toast.type === 'ok'
                ? 'bg-success-500 text-white'
                : 'bg-error-500 text-white'
            }`}
          >
            {toast.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
