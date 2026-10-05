export function deferLetter(item, now) {
  item.retryAfter = now + 5000;
  item.retryReady = false;
}

export function completeLetter(item, items) {
  item.retryAfter = 0;
  item.retryReady = false;
  for (const pending of items) {
    if (pending !== item && pending.retryAfter) pending.retryReady = true;
  }
}

// Candidates arrive in proximity order. A completed placement unlocks one retry.
export function nextLetter(candidates, now, otherArmBusy) {
  const retry = candidates.find(item => item.retryReady);
  if (retry) return retry;
  const fresh = candidates.find(item => !item.retryAfter);
  if (fresh) return fresh;
  if (otherArmBusy) return null;
  return candidates.find(item => now >= item.retryAfter) || null;
}
