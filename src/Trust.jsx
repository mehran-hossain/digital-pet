

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function getTrustLabel(level) {
  if (level === 1) return "Uneasy";
  if (level === 2) return "Warming up";
  if (level === 3) return "Friendly";
  if (level >= 4) return "Loving";
}

export function calculateTrustMeter(trustLevel) {
  const trustBase = trustLevel === 1 ? 15 : 30;
  const value = clamp(Math.round(trustLevel === 3 ? 45 : trustBase), 1, 100);
  return {
    value,
    label: getTrustLabel(trustLevel),
  };
}

export function checkTrustProgression(trustLevel, progress) {
  if (trustLevel === 1) {
    const canProgress =
      progress.gentleDialogueCount >= 3 &&
      progress.attemptedFeed &&
      progress.attemptedSitQuietly;
    if (canProgress) {
      return {
        nextTrustLevel: 2,
        message: "State 2 is ready. Advance to next day to activate it.",
      };
    }
    return null;
  }

  if (trustLevel === 2) {
    const canProgress =
      progress.dialogueCount >= 3 &&
      progress.spendTimeCount >= 2;
    if (canProgress) {
      return {
        nextTrustLevel: 3,
        message: "State 3 is ready. Advance to next day to activate it.",
      };
    }
    return null;
  }

  if (trustLevel >= 3) {
    const canProgress =
        progress.dialogueCount >= 5 &&
        progress.spendTimeCount >= 4;
    if (canProgress && trustLevel < 11) {
      return {
        nextTrustLevel: trustLevel + 1,
        message: `State ${trustLevel + 1} is ready. Advance to next day to activate it.`,
      };
    }
    return null;
  }

  return null;
}