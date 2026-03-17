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
      setFrame(0);
      const detectedRows = Math.max(1, Math.floor(img.naturalHeight / frameHeight));
      setRows(detectedRows);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, frameWidth]);

  useEffect(() => {
    if (fps <= 0 || frameCount <= 1) {
      // Don't animate; stay on the first frame
      return;
    }
    const msPerFrame = Math.max(1, Math.round(1000 / fps));
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, msPerFrame);
    return () => clearInterval(id);
  }, [fps, frameCount]);

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

