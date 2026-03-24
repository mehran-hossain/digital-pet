// Constants
export const GENTLE_SUGGESTIONS = [
  "It's okay",
  "I'll stay here",
  "Take your time",
  "You are safe with me",
  "I'm here when you're ready",
  "I'm not going anywhere",
];

export const HARSH_WORDS = ["stupid", "bad", "hate", "shut up", "idiot", "dumb"];

// Timing constants
export const ANIMATION_DURATION_MS = 4000;
export const FADE_OUT_MS = 280;
export const FADE_IN_MS = 280;
export const REPLY_DELAY_MS = 1200;
export const INTERACTION_COOLDOWN_MS = 700;

// Helper functions
export function getSuggestionsForDay(day) {
  if (day % 2 === 1) {
    return GENTLE_SUGGESTIONS.slice(0, 3);
  }
  return GENTLE_SUGGESTIONS.slice(3, 6);
}

export function createProgressState() {
  return {
    dialogueCount: 0,
    gentleDialogueCount: 0,
    attemptedFeed: false,
    attemptedSitQuietly: false,
    spendTimeCount: 0,
  };
}

export function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

export function isGentleTone(text) {
  const normalized = text.toLowerCase();
  return !HARSH_WORDS.some((word) => normalized.includes(word));
}
