import { MatchFeedback } from './guideMatch';

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

const ENTER_STREAK = 3;
const EXIT_MISS_STREAK = 2;
const SCORE_ALPHA = 0.45;

export function advanceMatchStability(
  previous: MatchStabilityState,
  feedback: MatchFeedback,
): MatchStabilityState {
  const rawMatched = feedback.status === 'matched';
  const sampleCount = previous.sampleCount + 1;
  const smoothedScore = previous.sampleCount === 0
    ? feedback.score
    : Math.round(previous.smoothedScore * (1 - SCORE_ALPHA) + feedback.score * SCORE_ALPHA);

  const matchedStreak = rawMatched ? previous.matchedStreak + 1 : 0;
  const missStreak = rawMatched ? 0 : previous.missStreak + 1;

  const stableMatched = previous.stableMatched
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
