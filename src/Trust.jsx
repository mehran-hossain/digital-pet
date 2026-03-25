function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function getTrustLabel(level) {
  if (level === 1) return "Uneasy";
  if (level === 2) return "Warming up";
  if (level === 3) return "Friendly";
  if (level >= 4) return "Loving";
  return "Uneasy";
}

export function calculateTrustMeter(trustLevel) {
  let value = 15;

  if (trustLevel === 2) value = 30;
  else if (trustLevel === 3) value = 45;
  else if (trustLevel >= 4) value = clamp(45 + (trustLevel - 3) * 8, 1, 100);

  return {
    value,
    label: getTrustLabel(trustLevel),
  };
}

export function checkTrustRegression(trustLevel, progress) {
  if (trustLevel <= 1) return null;

  const shouldRegress =
    progress.ignoredDay ||
    progress.harshDialogueCount >= 2 ||
    progress.forcedTouchCount >= 2;

  if (!shouldRegress) return null;

  return {
    nextTrustLevel: Math.max(1, trustLevel - 1),
    message: "Meowzart seems more withdrawn today.",
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
        message: "Meowzart seems a little less tense.",
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
        message: "Meowzart seems more comfortable around you.",
      };
    }

    return null;
  }

  if (trustLevel >= 3) {
    const canProgress =
      progress.dialogueCount >= 5 &&
      progress.spendTimeCount >= 4;

    if (canProgress && trustLevel < 10) {
      return {
        nextTrustLevel: trustLevel + 1,
        message: "Meowzart seems a little more trusting.",
      };
    }

    return null;
  }

  return null;
}