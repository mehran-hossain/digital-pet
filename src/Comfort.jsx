function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function getComfortLabel(level) {
  if (level === 1) return "Tense";
  if (level === 2) return "Wary";
  if (level === 3) return "Cautious";
  if (level === 4) return "Calmer";
  if (level === 5) return "Interested";
  if (level === 6) return "Encouraged";
  if (level === 7) return "Frightened";
  if (level === 8) return "Recovering";
  if (level === 9) return "Comfortable";
  return "Safe";
}

export function calculateComfortMeter(trustLevel) {
  const value = clamp(12 + (trustLevel - 1) * 9, 1, 100);

  return {
    value,
    label: getComfortLabel(trustLevel),
  };
}