// Pure validation helpers for race progress events.
// Extracted from server.js so they can be unit-tested in isolation,
// without spinning up sockets, rooms, or timers.

// Roughly: 250 WPM ≈ 1250 chars/min ≈ ~21 chars/sec.
// We allow some headroom (30 chars/sec) so a small clock drift on the
// very first event isn't punished, but a "0% → 100% in 1 second" claim
// is still rejected.
const MAX_HUMAN_CHARS_PER_SECOND = 30;

// Hard cap for a sanity check on the WPM value the client reports.
// World record (typeracer) is ~216 WPM; we round up.
const MAX_PLAUSIBLE_WPM = 250;

// Honest clients emit at ~250ms. We accept anything slower than 80ms
// (50% slack) and silently drop the rest.
const MIN_PROGRESS_INTERVAL_MS = 80;

// Allow this much clock-drift slack on top of the time-based progress cap,
// for the very first event in a race when the client clock vs server clock
// haven't aligned yet.
const PROGRESS_CLOCK_SLACK = 0.05;

/**
 * Decide whether to accept an incoming race progress event.
 *
 * @param {object} event - { progress, wpm, accuracy } from the client
 * @param {object} context - {
 *   prevProgress,           // last accepted progress for this player (0..1)
 *   lastProgressAt,         // ms timestamp of last accepted event (or 0)
 *   raceStartedAt,          // ms timestamp the race began
 *   now,                    // current ms timestamp
 *   textLength,             // length of the canonical race text
 * }
 * @returns {{ ok: boolean, reason?: string, progress?: number, wpm?: number, accuracy?: number }}
 */
function validateProgress(event, context) {
  const { progress, wpm, accuracy } = event || {};
  const { prevProgress, lastProgressAt, raceStartedAt, now, textLength } = context || {};

  // 1. Progress must be a finite number in [0, 1].
  let nextProgress = Number(progress);
  if (!Number.isFinite(nextProgress)) {
    return { ok: false, reason: 'progress not finite' };
  }
  nextProgress = Math.max(0, Math.min(1, nextProgress));

  // 2. Progress can never decrease.
  if (nextProgress < (prevProgress || 0)) {
    return { ok: false, reason: 'progress decreased' };
  }

  // 3. Cap progress per second based on max human typing speed.
  const elapsedMs = Math.max(0, now - raceStartedAt);
  const elapsedSec = Math.max(0.001, elapsedMs / 1000);
  const safeTextLen = Math.max(1, textLength || 1);
  const maxCharsPossible = elapsedSec * MAX_HUMAN_CHARS_PER_SECOND;
  const maxAllowedProgress = Math.min(1, maxCharsPossible / safeTextLen);
  if (nextProgress > maxAllowedProgress + PROGRESS_CLOCK_SLACK) {
    return { ok: false, reason: 'progress impossibly fast' };
  }

  // 4. Throttle: drop events that arrive too quickly.
  if (lastProgressAt && (now - lastProgressAt) < MIN_PROGRESS_INTERVAL_MS) {
    return { ok: false, reason: 'too frequent' };
  }

  // 5. Validate / clamp WPM and accuracy.
  let nextWpm = Math.max(0, Math.round(Number(wpm) || 0));
  if (nextWpm > MAX_PLAUSIBLE_WPM) nextWpm = MAX_PLAUSIBLE_WPM;
  // Missing/invalid accuracy defaults to 100 — a typist with zero typed chars
  // hasn't made any errors, so "100%" is the safe baseline. 0 would penalize
  // honest clients that simply haven't sent the field on the first event.
  const accNumeric = Number(accuracy);
  const accCoerced = Number.isFinite(accNumeric) ? accNumeric : 100;
  const nextAcc = Math.max(0, Math.min(100, Math.round(accCoerced)));

  return { ok: true, progress: nextProgress, wpm: nextWpm, accuracy: nextAcc };
}

module.exports = {
  validateProgress,
  MAX_HUMAN_CHARS_PER_SECOND,
  MAX_PLAUSIBLE_WPM,
  MIN_PROGRESS_INTERVAL_MS,
  PROGRESS_CLOCK_SLACK,
};
