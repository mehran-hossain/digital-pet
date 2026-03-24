import { PetSprite } from "./components/PetSprite";

export function Pet({
  currentSprite,
  alt = "cat",
  trustLevel,
  isTrust2SitAnimationActive,
  isPetAnimationActive,
  petSprite,
  isFeedAnimationActive,
  eatingSprite,
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
  }

  // Determine animation speed based on active animations and trust level
  let fps;
  if (isPetAnimationActive || isFeedAnimationActive) {
    fps = 8;
  } else if (trustLevel === 2 && isTrust2SitAnimationActive) {
    fps = 8;
  } else if (trustLevel === 1) {
    fps = 0;
  } else {
    fps = 8;
  }

  // Determine start frame for animation
  const startFrame =
    trustLevel === 2 && isTrust2SitAnimationActive ? 3 : 0;

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
