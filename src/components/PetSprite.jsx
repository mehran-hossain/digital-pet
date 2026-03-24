import { useEffect, useMemo, useState } from "react";

/**
 * Renders a single-row sprite sheet (frames placed side-by-side).
 * Assumes each frame is frameWidth x frameHeight pixels.
 */
export function PetSprite({
  src,
  alt = "pet",
  frameWidth = 32,
  frameHeight = 32,
  scale = 4,
  fps = 8,
  startFrame = 0,
  className = "",
}) {
  const [frameCount, setFrameCount] = useState(1);
  const [frame, setFrame] = useState(0);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const frames = Math.max(1, Math.floor(img.naturalWidth / frameWidth));
      setFrameCount(frames);
      const clampedStart = Math.max(0, Math.min(startFrame, frames - 1));
      setFrame(clampedStart);
      const detectedRows = Math.max(1, Math.floor(img.naturalHeight / frameHeight));
      setRows(detectedRows);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, frameWidth, frameHeight, startFrame]);

  useEffect(() => {
    if (fps <= 0 || frameCount <= 1) {
      // Don't animate; stay on the configured starting frame.
      return;
    }
    const firstFrame = Math.max(0, Math.min(startFrame, frameCount - 1));
    const msPerFrame = Math.max(1, Math.round(1000 / fps));
    const id = setInterval(() => {
      setFrame((f) => (f < firstFrame || f >= frameCount - 1 ? firstFrame : f + 1));
    }, msPerFrame);
    return () => clearInterval(id);
  }, [fps, frameCount, startFrame]);

  const style = useMemo(() => {
    const scaledW = frameWidth * scale;
    const scaledH = frameHeight * scale;
    const sheetHeight = frameHeight * rows * scale;
    return {
      width: scaledW,
      height: scaledH,
      backgroundImage: `url(${src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${frameWidth * frameCount * scale}px ${sheetHeight}px`,
      backgroundPosition: `-${frame * scaledW}px 0px`,
      imageRendering: "pixelated",
      // Helps some browsers keep it crisp
      WebkitFontSmoothing: "none",
    };
  }, [src, frameWidth, frameHeight, scale, frameCount, frame, rows]);

  return (
    <div
      className={className}
      style={style}
      role="img"
      aria-label={alt}
      title={alt}
    />
  );
}

