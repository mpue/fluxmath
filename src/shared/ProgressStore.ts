/** Lightweight localStorage-backed progress tracking for exercises.
 *  Stores per-topic best scores and total attempts. */

const STORAGE_KEY = 'fluxmath_progress';

export interface TopicProgress {
  correct: number;
  total: number;
  bestPct: number;
  lastAttempt: string;  // ISO date string
}

export type ProgressMap = Record<string, TopicProgress>;

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressMap;
  } catch { /* ignore corrupt data */ }
  return {};
}

function save(data: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded – silently fail */ }
}

export function getProgress(): ProgressMap {
  return load();
}

export function getTopicProgress(topicId: string): TopicProgress | null {
  const data = load();
  return data[topicId] ?? null;
}

export function recordResult(topicId: string, correct: number, total: number): void {
  const data = load();
  const prev = data[topicId];
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  data[topicId] = {
    correct: (prev?.correct ?? 0) + correct,
    total: (prev?.total ?? 0) + total,
    bestPct: Math.max(prev?.bestPct ?? 0, pct),
    lastAttempt: new Date().toISOString(),
  };
  save(data);
}

export function resetProgress(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
