// No attendance model exists yet — approximate progress from the weekly
// cadence (one session per week) elapsed since enrollment, capped at the
// course's total planned sessions. A supportive estimate shown to parents
// and teachers alike, not a precise attendance record.
export function estimateCompletedSessions(enrolledAt: Date, totalSessions: number): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((Date.now() - enrolledAt.getTime()) / msPerWeek);
  return Math.max(0, Math.min(totalSessions, weeksElapsed));
}

export function percentFromCompleted(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
