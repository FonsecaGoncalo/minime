import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

export default function RollingPrompts({
  prompts,
  onSelect,
  durationSec = 80,
  className = '',
  rows = 3,
}) {
  const containerRef = useRef(null);
  const chipRefs = useRef([]);
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Distribute prompts into N rows round-robin
  const rowSets = useMemo(() => {
    const base = Array.isArray(prompts) ? prompts : [];
    const sets = Array.from({ length: Math.max(1, rows) }, () => []);
    base.forEach((p, i) => sets[i % sets.length].push(p));
    return sets.map((set) => (set.length ? set : base));
  }, [prompts, rows]);

  // Build per-row data (repeated items and direction)

  // Dimming measurement via rAF (avoids IO churn with transforms). Adds a margin to reduce flicker.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let raf = 0;
    let last = 0;
    const EPS = 6; // px safety margin to avoid rapid toggling at edges

    const measure = (ts) => {
      if (ts - last > 80) {
        const rootRect = root.getBoundingClientRect();
        const leftBound = rootRect.left + EPS;
        const rightBound = rootRect.right - EPS;
        chipRefs.current.forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const fully = r.left >= leftBound && r.right <= rightBound;
          const has50 = el.classList.contains('opacity-50');
          if (fully && has50) {
            el.classList.remove('opacity-50');
            el.classList.add('opacity-100');
          } else if (!fully && !has50) {
            el.classList.remove('opacity-100');
            el.classList.add('opacity-50');
          }
        });
        last = ts;
      }
      raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    const onResize = () => {
      last = 0; // force a pass next frame
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [prompts, rows]);

  // No auto-scroll JS (CSS keyframes handle it); respect reduced motion via CSS override

  // Build per-row data (repeated items and direction)
  const rowsData = useMemo(() => {
    // Build items repeated 4x to ensure wide track and seamless loop
    const repeatN = (arr, n) => Array.from({ length: n }, () => arr).flat();
    return rowSets.map((set, i) => ({
      items: repeatN(set || [], 4),
      reverse: i === 1,
      index: i,
    }));
  }, [rowSets]);

  // No runtime speed state needed; CSS handles timing.

  return (
    <div className={`relative w-full overflow-hidden rp-group ${className}`} ref={containerRef}>

      <div className="w-full">
        {rowsData.map((row, rowIndex) => (
          <div key={rowIndex} className="my-1.5">
            <div
              className={`rp-anim ${row.reverse ? 'rp-rev' : ''} flex flex-nowrap gap-1.5 sm:gap-2 items-center will-change-transform min-w-[200%]`}
              style={{ ['--rp-duration']: `${Math.max(30, Math.min(600, durationSec + (rowIndex - 1) * 6))}s` }}
            >
              {row.items.map((p, i) => (
                <button
                  key={`${rowIndex}-${p}-${i}`}
                  ref={(el) => (chipRefs.current[rowIndex * 10000 + i] = el)}
                  type="button"
                  onClick={() => onSelect && onSelect(p)}
                  className="rp-chip group relative inline-flex items-center select-none rounded-md border border-borderCosmos bg-surface/80 backdrop-blur text-ink shadow-sm transition-colors hover:bg-surface/90 focus:outline-none focus:ring-2 focus:ring-brand/30 ring-offset-1 ring-offset-surface opacity-100 px-3.5 pr-7 sm:px-4 sm:pr-8 py-2 sm:py-2.5 h-14 text-xs sm:text-sm text-left whitespace-normal break-words min-w-[180px] sm:min-w-[200px] md:min-w-[220px] max-w-[300px] sm:max-w-[360px] md:max-w-[420px]"
                >
                  <span className="rp-text leading-snug w-full">{p}</span>
                  <ArrowUpRightIcon className="pointer-events-none absolute bottom-1.5 right-1.5 w-4 h-4 text-muted group-hover:text-ink transition-colors" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        /* Pause only the hovered row/track, not all rows */
        .rp-anim:hover { animation-play-state: paused; }
        .rp-anim { animation: rp-scroll var(--rp-duration, 80s) linear infinite; backface-visibility: hidden; transform: translate3d(0,0,0); }
        .rp-anim.rp-rev { animation-direction: reverse; }
        @keyframes rp-scroll { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) { .rp-anim { animation: none !important; transform: none !important; } }
        .rp-text{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

      `}</style>
    </div>
  );
}
