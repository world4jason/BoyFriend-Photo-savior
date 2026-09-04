import {
  advanceMatchStability,
  didEnterStableMatch,
  isSevereMatchMiss,
  resetMatchStability,
  stableMatchProgress,
} from '../src/matching/stableMatch';
import type { MatchFeedback } from '../src/matching/guideMatch';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function feedback(overrides: Partial<MatchFeedback> = {}): MatchFeedback {
  return {
    score: 90,
    framingScore: 90,
    scaleScore: 90,
    poseScore: 90,
    faceScore: 90,
    status: 'matched',
    hint: '✓ Match',
    detail: 'Composition is close enough to shoot.',
    ...overrides,
  };
}

function test(name: string, run: () => void) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('two consecutive raw matches enter stable exactly once', () => {
  const initial = resetMatchStability();
  const first = advanceMatchStability(initial, feedback({ score: 88 }));
  const second = advanceMatchStability(first, feedback({ score: 90 }));
  const third = advanceMatchStability(second, feedback({ score: 92 }));

  equal(first.stableMatched, false, 'first raw match must only hold');
  equal(first.matchedStreak, 1, 'first raw match increments streak');
  equal(stableMatchProgress(first).current, 1, 'progress after first match');
  equal(stableMatchProgress(first).required, 2, 'stable entry requirement');
  equal(second.stableMatched, true, 'second consecutive match enters stable');
  equal(didEnterStableMatch(first, second), true, 'stable-entry event fires once');
  equal(didEnterStableMatch(second, third), false, 'continued stable samples do not retrigger entry');
});

test('one minor miss is tolerated but two consecutive minor misses exit stable', () => {
  let state = resetMatchStability();
  state = advanceMatchStability(state, feedback());
  state = advanceMatchStability(state, feedback());
  assert(state.stableMatched, 'setup must reach stable');

  const minorMiss = feedback({
    score: 78,
    framingScore: 78,
    scaleScore: 82,
    status: 'adjust',
    hint: 'Adjust pose',
  });

  const firstMiss = advanceMatchStability(state, minorMiss);
  const secondMiss = advanceMatchStability(firstMiss, minorMiss);

  equal(isSevereMatchMiss(minorMiss), false, 'minor miss must not be severe');
  equal(firstMiss.stableMatched, true, 'one minor miss keeps hysteresis');
  equal(firstMiss.missStreak, 1, 'first miss increments miss streak');
  equal(secondMiss.stableMatched, false, 'second consecutive minor miss exits stable');
});

test('severe miss exits stable immediately and resets stale EMA headline', () => {
  let state = resetMatchStability();
  state = advanceMatchStability(state, feedback({ score: 94 }));
  state = advanceMatchStability(state, feedback({ score: 96 }));
  assert(state.stableMatched, 'setup must reach stable');
  assert(state.smoothedScore > 90, 'setup should have a high headline score');

  const severeMiss = feedback({
    score: 35,
    framingScore: 32,
    scaleScore: 82,
    status: 'adjust',
    hint: 'Subject → left',
  });
  const next = advanceMatchStability(state, severeMiss);

  equal(isSevereMatchMiss(severeMiss), true, 'sample qualifies as severe');
  equal(next.stableMatched, false, 'severe miss exits stable immediately');
  equal(next.smoothedScore, 35, 'headline must snap to severe raw score instead of stale EMA');
});

test('normal non-severe score jitter still uses EMA smoothing', () => {
  const first = advanceMatchStability(resetMatchStability(), feedback({ score: 90 }));
  const jitter = feedback({
    score: 70,
    framingScore: 72,
    scaleScore: 75,
    status: 'adjust',
  });
  const second = advanceMatchStability(first, jitter);

  equal(isSevereMatchMiss(jitter), false, 'jitter sample must remain non-severe');
  equal(second.smoothedScore, 81, 'EMA should be round(90*0.55 + 70*0.45)');
  assert(second.smoothedScore !== jitter.score, 'normal jitter must not snap directly to raw score');
});

test('severe scale failure is severe even when aggregate score is not low', () => {
  const scaleFailure = feedback({
    score: 76,
    framingScore: 85,
    scaleScore: 35,
    status: 'adjust',
  });
  equal(isSevereMatchMiss(scaleFailure), true, 'scale threshold must independently trigger severe miss');
});

console.log('Stable Match regression suite passed.');
