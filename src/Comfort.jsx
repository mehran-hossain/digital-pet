

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function getComfortLabel(level) {
  if (level === 1) return "Scared";
  if (level === 2) return "Cautious";
  if (level === 3) return "Calmer";
  return "Cautious";
}

export function calculateComfortMeter(trustLevel) {
  const comfortBase = trustLevel === 1 ? 20 : trustLevel === 2 ? 36 : 50;
  const value = clamp(Math.round(comfortBase), 1, 100);
  return {
    value,
    label: getComfortLabel(trustLevel),
  };
}