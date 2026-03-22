/** Achievement / Badge system backed by localStorage.
 *  Checks conditions against ProgressStore and topic-visit data. */

import { getProgress, ProgressMap } from './ProgressStore';

const ACH_KEY = 'fluxmath_achievements';
const VISIT_KEY = 'fluxmath_visits';

/* ── Achievement definitions ─────────────────────────── */
export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  check: (progress: ProgressMap, visits: string[]) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_exercise', icon: '🎯', title: 'Erster Schritt',
    description: 'Erste Übung abgeschlossen',
    check: (p) => Object.values(p).some(v => v.total > 0) },
  { id: 'perfect_score', icon: '💎', title: 'Diamant',
    description: '100 % in einer Übung',
    check: (p) => Object.values(p).some(v => v.bestPct === 100) },
  { id: 'five_topics', icon: '📚', title: 'Wissensdurst',
    description: '5 verschiedene Themen besucht',
    check: (_, v) => v.length >= 5 },
  { id: 'ten_topics', icon: '🎓', title: 'Entdecker',
    description: '10 verschiedene Themen besucht',
    check: (_, v) => v.length >= 10 },
  { id: 'twenty_topics', icon: '🏛️', title: 'Gelehrter',
    description: '20 verschiedene Themen besucht',
    check: (_, v) => v.length >= 20 },
  { id: 'fifty_exercises', icon: '🔥', title: 'Fleißig',
    description: '50 Aufgaben insgesamt gelöst',
    check: (p) => Object.values(p).reduce((s, v) => s + v.total, 0) >= 50 },
  { id: 'hundred_exercises', icon: '⚡', title: 'Unaufhaltsam',
    description: '100 Aufgaben insgesamt gelöst',
    check: (p) => Object.values(p).reduce((s, v) => s + v.total, 0) >= 100 },
  { id: 'three_perfects', icon: '🏆', title: 'Hattrick',
    description: '100 % in drei verschiedenen Themen',
    check: (p) => Object.values(p).filter(v => v.bestPct === 100).length >= 3 },
  { id: 'streak_3', icon: '🔗', title: 'Streak × 3',
    description: '3 Tage hintereinander geübt',
    check: (p) => checkStreak(p, 3) },
  { id: 'streak_7', icon: '💪', title: 'Streak × 7',
    description: '7 Tage hintereinander geübt',
    check: (p) => checkStreak(p, 7) },
  { id: 'correct_80pct', icon: '🧠', title: 'Scharfer Verstand',
    description: 'Gesamtquote über 80 %',
    check: (p) => {
      const tot = Object.values(p).reduce((s, v) => s + v.total, 0);
      const cor = Object.values(p).reduce((s, v) => s + v.correct, 0);
      return tot >= 10 && cor / tot >= 0.8;
    } },
  { id: 'night_owl', icon: '🦉', title: 'Nachteule',
    description: 'Nach Mitternacht geübt',
    check: (p) => Object.values(p).some(v => { const h = new Date(v.lastAttempt).getHours(); return h >= 0 && h < 5; }) },
];

/* ── Streak helper ───────────────────────────────────── */
function checkStreak(progress: ProgressMap, days: number): boolean {
  const dates = new Set<string>();
  for (const v of Object.values(progress)) {
    if (v.lastAttempt) dates.add(v.lastAttempt.slice(0, 10));
  }
  // Also check all exercise days stored separately
  const sorted = [...dates].sort().reverse();
  if (sorted.length < days) return false;
  // Check if last N days form consecutive streak
  const today = new Date();
  for (let streak = 0, d = new Date(today); streak < days; streak++) {
    const ds = d.toISOString().slice(0, 10);
    if (!dates.has(ds)) return false;
    d.setDate(d.getDate() - 1);
  }
  return true;
}

/* ── State persistence ───────────────────────────────── */
export interface AchievementState {
  unlocked: Record<string, string>; // id → ISO date
}

function loadState(): AchievementState {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unlocked: {} };
}

function saveState(s: AchievementState) {
  try { localStorage.setItem(ACH_KEY, JSON.stringify(s)); } catch {}
}

/* ── Visit tracking ──────────────────────────────────── */
export function recordVisit(topicId: string) {
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    const visits: string[] = raw ? JSON.parse(raw) : [];
    if (!visits.includes(topicId)) {
      visits.push(topicId);
      localStorage.setItem(VISIT_KEY, JSON.stringify(visits));
    }
  } catch {}
}

export function getVisits(): string[] {
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/* ── Check & unlock ──────────────────────────────────── */
export function getUnlocked(): Record<string, string> {
  return loadState().unlocked;
}

/** Returns IDs of newly unlocked achievements (empty if none new). */
export function checkAchievements(): string[] {
  const state = loadState();
  const progress = getProgress();
  const visits = getVisits();
  const newlyUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (state.unlocked[ach.id]) continue;
    if (ach.check(progress, visits)) {
      state.unlocked[ach.id] = new Date().toISOString();
      newlyUnlocked.push(ach.id);
    }
  }

  if (newlyUnlocked.length) saveState(state);
  return newlyUnlocked;
}
