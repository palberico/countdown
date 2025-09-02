 // src/utils/time.js
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function getEventPhase(dateValue, nowTs = Date.now()) {
  // dateValue should be a valid ISO string like "2025-08-21T12:00:00"
  const endTs = new Date(dateValue).getTime();
  if (Number.isNaN(endTs)) {
    return { phase: "invalid", endTs: 0, remainingMs: 0 };
  }

  const diff = endTs - nowTs;

  if (diff > 0) {
    return { phase: "countdown", endTs, remainingMs: diff };
  }

  const sinceEnd = nowTs - endTs;

  if (sinceEnd < SIX_HOURS_MS) {
    // Inside the 6 hour celebration window
    return { phase: "celebrate", endTs, remainingMs: SIX_HOURS_MS - sinceEnd };
  }

  // More than 6 hours past the end
  return { phase: "expired", endTs, remainingMs: 0 };
}
