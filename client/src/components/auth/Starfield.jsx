import { useMemo } from "react";

const STAR_COUNT = 48;

const Starfield = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        top: `${(i * 23 + 11) % 100}%`,
        size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
        delay: `${-(i * 0.37) % 5}s`,
        duration: `${2.5 + (i % 4) * 0.8}s`,
        driftDuration: `${18 + (i % 6) * 4}s`,
        driftX: `${-12 + (i % 5) * 6}px`,
        driftY: `${-20 + (i % 4) * 8}px`,
        opacity: 0.25 + (i % 5) * 0.12,
      })),
    []
  );

  const shootingStars = useMemo(
    () =>
      [0, 1, 2].map((i) => ({
        id: i,
        top: `${15 + i * 22}%`,
        left: `${10 + i * 30}%`,
        delay: `${i * 4.5 + 2}s`,
      })),
    []
  );

  return (
    <div className="auth-starfield" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="auth-star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            "--twinkle-dur": s.duration,
            "--twinkle-delay": s.delay,
            "--drift-dur": s.driftDuration,
            "--drift-x": s.driftX,
            "--drift-y": s.driftY,
          }}
        />
      ))}
      {shootingStars.map((s) => (
        <span
          key={`shoot-${s.id}`}
          className="auth-shooting-star"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
};

export default Starfield;
