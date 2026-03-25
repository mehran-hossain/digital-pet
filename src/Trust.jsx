function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function getTrustLabel(level) {
  if (level === 1) return "Fear";
  if (level === 2) return "Observation";
  if (level === 3) return "First Step";
  if (level === 4) return "Tolerance";
  if (level === 5) return "Curiosity";
  if (level === 6) return "Acceptance";
  if (level === 7) return "Setback";
  if (level === 8) return "Rebuilding";
  if (level === 9) return "Affection";
  if (level >= 10) return "Bond";
  return "Fear";
}

export function calculateTrustMeter(trustLevel) {
  const value = clamp(10 + (trustLevel - 1) * 10, 1, 100);

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
        message: "Meowzart seems willing to come a little closer.",
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
        message: "Meowzart seems ready for the next step.",
      };
    }

    return null;
  }

  return null;
}