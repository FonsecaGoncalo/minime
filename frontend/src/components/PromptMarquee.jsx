// src/components/PromptMarquee.jsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';

function PromptCard({ text, onClick }) {
  return (
    <button
      type="button"
      className="
        prompt-card group relative
        w-[300px] sm:w-[320px] md:w-[340px] xl:w-[360px] 2xl:w-[380px]
        h-[78px] md:h-[84px]
        rounded-lg
        bg-white/95 backdrop-blur
        border border-gray-200
        shadow-sm hover:shadow-md
        transition-transform hover:-translate-y-0.5 active:translate-y-0
        text-left
        focus:outline-none focus:ring-2 focus:ring-brand/30 ring-offset-1 ring-offset-white
        px-4 py-3
      "
      aria-label={text}
      title={text}
      onClick={onClick}
      /* default to dim until first measurement to avoid flash */
      data-dim="1"
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-[15px] leading-snug text-gray-900 font-normal">
          <span className="block overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
            {text}
          </span>
        </p>
        <ArrowUpRightIcon
          className="w-4 h-4 shrink-0 mt-[2px] text-gray-400 group-hover:text-gray-600 transition-colors"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

export default function PromptMarquee({
  items,
  onSelect,
  rows = 3,
  speedBase = 36,
  gap = 10,
  speedPps, // optional: pixels-per-second override for consistent reading speed
  paused = false,
  className = '',
}) {
  // Base lanes (single sequence per row)
  const baseLanes = useMemo(() => {
    const src = shuffle(items);
    const perRow = Math.max(1, Math.ceil(src.length / rows));
    return new Array(rows).fill(0).map((_, i) => src.slice(i * perRow, i * perRow + perRow));
  }, [items, rows]);

  // Dynamic repeat counts to ensure: baseWidth * repeat >= containerWidth * 2 (for seamless A|A loop)
  const [repeatCounts, setRepeatCounts] = useState(() => new Array(rows).fill(2));
  const [durations, setDurations] = useState(() => new Array(rows).fill(speedBase));

  const rowRefs = useRef([]);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  const setRowRef = (i) => (el) => { rowRefs.current[i] = el; };

  // Throttled measurement loop for dimming vs viewport (works with CSS transforms)
  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function measureOnce() {
      const EPS = 0.5; // px tolerance to consider fully visible
      const viewportLeft = 0;
      const viewportRight = (typeof window !== 'undefined' ? window.innerWidth : 0) || document.documentElement.clientWidth || 0;
      rowRefs.current.forEach((row) => {
        if (!row) return;
        const cards = row.querySelectorAll('.prompt-card');
        cards.forEach((card) => {
          const r = card.getBoundingClientRect();
          const fullyVisible = r.left >= viewportLeft + EPS && r.right <= viewportRight - EPS;
          const shouldDim = !fullyVisible;
          const isDim = card.getAttribute('data-dim') === '1';
          if (isDim !== shouldDim) {
            card.setAttribute('data-dim', shouldDim ? '1' : '0');
          }
        });
      });
    }

    if (reduceMotion) {
      measureOnce();
      return;
    }

    function loop(ts) {
      // ~12fps: enough for smooth dim without wasted CPU
      if (ts - lastTsRef.current > 80) {
        measureOnce();
        lastTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    // Prime & start
    measureOnce();
    rafRef.current = requestAnimationFrame(loop);

    // Also re-measure on resize
    const onResize = () => measureOnce();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [baseLanes.length]);

  // Ensure each row has enough repeated content to fill container seamlessly
  useEffect(() => {
    function computeRepeatsAndDurations() {
      const nextRepeats = [...repeatCounts];
      const nextDurations = [...durations];
      let changedRepeats = false;
      let changedDurations = false;

      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const track = row.querySelector('.prompt-track');
        if (!track || (baseLanes[i]?.length ?? 0) === 0) return;
        const currentRepeat = repeatCounts[i] ?? 2;
        const trackWidth = track.scrollWidth || track.offsetWidth || 0;
        const baseWidth = trackWidth / currentRepeat || 1;
        const containerWidth = row.clientWidth || 0;
        // Need at least 2x container width for A|A loop; add 10% buffer
        const needed = Math.ceil(((containerWidth * 2.1) / baseWidth) || 2);
        // Make it even and clamp
        const evenNeeded = Math.max(2, needed + (needed % 2));
        const finalRepeat = Math.min(evenNeeded, 24);
        if (finalRepeat !== currentRepeat) {
          nextRepeats[i] = finalRepeat;
          changedRepeats = true;
        }

        // Determine duration in seconds for consistent px/sec if provided
        if (speedPps && baseWidth > 0) {
          const shiftPx = (baseWidth * finalRepeat) / 2; // -50% shift distance
          const pps = Math.max(4, Math.min(64, speedPps));
          const sec = shiftPx / pps;
          const clampedSec = Math.max(30, Math.min(600, sec));
          if (Math.abs((durations[i] ?? 0) - clampedSec) > 0.5) {
            nextDurations[i] = clampedSec;
            changedDurations = true;
          }
        } else {
          // Fallback: keep provided base seconds, with slight stagger by row
          const sec = speedBase + i * 2.2;
          if ((durations[i] ?? 0) !== sec) {
            nextDurations[i] = sec;
            changedDurations = true;
          }
        }
      });

      if (changedRepeats) setRepeatCounts(nextRepeats);
      if (changedDurations) setDurations(nextDurations);
    }

    // Compute after paint to get accurate widths
    const id = requestAnimationFrame(computeRepeatsAndDurations);
    window.addEventListener('resize', computeRepeatsAndDurations);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', computeRepeatsAndDurations);
    };
  }, [baseLanes, repeatCounts, durations, speedBase, speedPps]);

  return (
    <div className={`prompt-marquee w-full ${paused ? 'paused' : ''} ${className}`}>
      {baseLanes.map((lane, i) => {
        const duration = durations[i] ?? speedBase;
        const reverse = i % 2 === 1;
        const repeat = repeatCounts[i] ?? 2;

        return (
          <div
            key={i}
            ref={setRowRef(i)}
            className={`prompt-row ${reverse ? 'reverse' : ''} my-1`}
            style={{ ['--duration']: `${duration}s`, ['--gap']: `${gap}px` }}
          >
            <ul className="prompt-track">
              {Array.from({ length: repeat }).map((_, rep) => (
                lane.map((it, idx) => (
                  <li key={`${i}-${rep}-${idx}`} className="flex-shrink-0">
                    <PromptCard text={it.text} onClick={() => onSelect?.(it.text)} />
                  </li>
                ))
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
