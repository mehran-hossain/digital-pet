import { useEffect } from "react";
import { useAnimation } from "./useAnimation";

const ANIMATION_DURATION_MS = 4000;

export function Feed({ onFeed, disabled, trustLevel = 1, onAnimationStateChange }) {
  const { isActive: isFeedAnimationActive, trigger: triggerAnimation, cleanup } = useAnimation(ANIMATION_DURATION_MS);

  // Notify parent of animation state changes
  useEffect(() => {
    if (onAnimationStateChange) {
      onAnimationStateChange(isFeedAnimationActive);
    }
  }, [isFeedAnimationActive, onAnimationStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleClick = () => {
    // Trigger animation only if trust level is 4 or higher
    if (trustLevel >= 4) {
      triggerAnimation();
    }
    // Always call the parent's feed handler
    onFeed();
  };

  return (
    <button onClick={handleClick} disabled={disabled}>
      Feed
    </button>
  );
}
