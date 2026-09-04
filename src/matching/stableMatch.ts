import type { MatchFeedback } from './guideMatch';

export type MatchStabilityState = {
  sampleCount: number;
  smoothedScore: number;
  matchedStreak: number;
  missStreak: number;
  stableMatched: boolean;
};

export const INITIAL_MATCH_STABILITY: MatchStabilityState = {
  sampleCount: 0,
  smoothedScore: 0,
  matchedStreak: 0,
  missStreak: 0,
  stableMatched: false,
};

const ENTER_STREAK = 2;
const EXIT_MISS_STREAK = 2;
const SCORE_ALPHA = 0.45;

/**
 * A severe miss means the subject has materially left the target framing/scale,
 * not a small pose/face wobble. Severe misses clear an existing stable match
 * immediately; minor misses get one-sample hysteresis.
 */
export function isSevereMatchMiss(feedback: MatchFeedback): boolean {
  if (feedback.status === 'matched') return false;
  return feedback.score < 55
    || feedback.framingScore < 40
    || feedback.scaleScore < 40;
}

export function advanceMatchStability(
  previous: MatchStabilityState,
  feedback: MatchFeedback,
): MatchStabilityState {
  const rawMatched = feedback.status === 'matched';
  const severeMiss = isSevereMatchMiss(feedback);
  const sampleCount = previous.sampleCount + 1;

  // EMA is useful for normal sampled-analysis jitter, but a severe framing/scale
  // miss is an intentional discontinuity. Carrying a previous high EMA through
  // that transition would present stale confidence after stable match is already
  // invalid, so severe misses snap the headline back to the current raw score.
  const smoothedScore = severeMiss || previous.sampleCount === 0
    ? feedback.score
    : Math.round(previous.smoothedScore * (1 - SCORE_ALPHA) + feedback.score * SCORE_ALPHA);

  const matchedStreak = rawMatched ? previous.matchedStreak + 1 : 0;
  const missStreak = rawMatched ? 0 : previous.missStreak + 1;

  const stableMatched = severeMiss
    ? false
    : previous.stableMatched
      ? missStreak < EXIT_MISS_STREAK
      : matchedStreak >= ENTER_STREAK;

  return {
    sampleCount,
    smoothedScore,
    matchedStreak,
    missStreak,
    stableMatched,
  };
}

export function resetMatchStability(): MatchStabilityState {
  return { ...INITIAL_MATCH_STABILITY };
}

export function stableMatchProgress(state: MatchStabilityState): { current: number; required: number } {
  return {
    current: Math.min(state.matchedStreak, ENTER_STREAK),
    required: ENTER_STREAK,
  };
}

/** Future Auto Capture should fire only on this transition, not every stable sample. */
export function didEnterStableMatch(
  previous: MatchStabilityState,
  next: MatchStabilityState,
): boolean {
  return !previous.stableMatched && next.stableMatched;
}
