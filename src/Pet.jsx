import { PetSprite } from "./components/PetSprite";

export function Pet({
  currentSprite,
  alt = "cat",
  trustLevel,
  isCatInBox = true,
  isTrust2SitAnimationActive,
  isPetAnimationActive,
  petSprite,
  isPetRefusalAnimationActive,
  petRefusalSprite,
  isFeedAnimationActive,
  eatingSprite,
  isFeedFailureAnimationActive,
  feedFailureSprite,
  sitQuietSprite,
  frameWidth = 32,
  frameHeight = 32,
  scale = 4,
}) {
  // Use animation sprites when active, otherwise use current sprite
  let sprite = currentSprite;
  if (isPetAnimationActive) {
    sprite = petSprite;
  } else if (isFeedAnimationActive) {
    sprite = eatingSprite;
  } else if (
    isTrust2SitAnimationActive &&
    isCatInBox &&
    sitQuietSprite
  ) {
    sprite = sitQuietSprite;
  } else if (
    isFeedFailureAnimationActive &&
    isCatInBox &&
    feedFailureSprite
  ) {
    sprite = feedFailureSprite;
  } else if (isPetRefusalAnimationActive && petRefusalSprite) {
    sprite = petRefusalSprite;
  }

  // Determine animation speed based on active animations and trust level
  let fps;
  if (
    isPetAnimationActive ||
    isFeedAnimationActive ||
    (isFeedFailureAnimationActive && isCatInBox) ||
    isPetRefusalAnimationActive
  ) {
    fps = 8;
  } else if (isCatInBox && isTrust2SitAnimationActive) {
    fps = 8;
  } else if (trustLevel === 1) {
    fps = 0;
  } else {
    fps = 8;
  }

  // Determine start frame for animation
  const startFrame = 0;

  return (
    <PetSprite
      className="pet-sprite"
      src={sprite}
      alt={alt}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      scale={scale}
      fps={fps}
      startFrame={startFrame}
    />
  );
}
