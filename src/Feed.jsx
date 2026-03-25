import { useEffect } from "react";
import { useAnimation } from "./useAnimation";

const ANIMATION_DURATION_MS = 4000;

export function Feed({
  onFeed,
  disabled,
  trustLevel = 1,
  onAnimationStateChange,
}) {
  const {
    isActive: isFeedAnimationActive,
    trigger: triggerAnimation,
    cleanup,
  } = useAnimation(ANIMATION_DURATION_MS);

  useEffect(() => {
    if (onAnimationStateChange) {
      onAnimationStateChange(isFeedAnimationActive);
    }
  }, [isFeedAnimationActive, onAnimationStateChange]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleClick = () => {
    if (trustLevel >= 6) {
      triggerAnimation();
    }
    onFeed();
  };

  return (
    <button onClick={handleClick} disabled={disabled}>
      Feed
    </button>
  );
}