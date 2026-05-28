"use client";
import React, { useMemo } from "react";

// Pre-generated star configurations to avoid Math.random() in render
const STAR_CONFIGS = [
  { cx: 15, cy: 20, scale: 0.3, delay: 0, dur: 2.5 },
  { cx: 75, cy: 12, scale: 0.45, delay: 0.8, dur: 3.0 },
  { cx: 40, cy: 80, scale: 0.25, delay: 1.6, dur: 2.8 },
  { cx: 85, cy: 65, scale: 0.4, delay: 0.4, dur: 3.2 },
  { cx: 25, cy: 55, scale: 0.35, delay: 1.2, dur: 2.6 },
  { cx: 60, cy: 40, scale: 0.3, delay: 2.0, dur: 3.5 },
];

// Second set for variety when multiple instances are visible
const STAR_CONFIGS_ALT = [
  { cx: 20, cy: 30, scale: 0.35, delay: 0.3, dur: 2.7 },
  { cx: 70, cy: 18, scale: 0.4, delay: 1.1, dur: 3.1 },
  { cx: 45, cy: 75, scale: 0.28, delay: 1.9, dur: 2.9 },
  { cx: 80, cy: 55, scale: 0.32, delay: 0.6, dur: 3.3 },
  { cx: 30, cy: 45, scale: 0.38, delay: 1.5, dur: 2.4 },
  { cx: 55, cy: 35, scale: 0.42, delay: 2.2, dur: 3.0 },
];

let instanceCounter = 0;

export function RandomStars() {
  // Alternate between configs for visual variety across instances
  const configSet = useMemo(() => {
    instanceCounter++;
    return instanceCounter % 2 === 0 ? STAR_CONFIGS_ALT : STAR_CONFIGS;
  }, []);

  return (
    <svg
      className="absolute w-full h-full top-0 left-0 pointer-events-none mix-blend-screen opacity-70"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path
          id="star-path"
          d="M 0,-5 L 1,-1 L 5,0 L 1,1 L 0,5 L -1,1 L -5,0 L -1,-1 Z"
          fill="#FFF"
        />
        <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {configSet.map((s, i) => (
        <svg
          key={i}
          x={`${s.cx}%`}
          y={`${s.cy}%`}
          className="overflow-visible"
        >
          <g
            transform={`scale(${s.scale})`}
            opacity="0"
            filter="url(#star-glow)"
          >
            <use href="#star-path" />
            <animate
              attributeName="opacity"
              values="0; 1; 0.5; 1; 0"
              dur={`${s.dur}s`}
              repeatCount="indefinite"
              begin={`${s.delay}s`}
            />
            <animateTransform
              attributeName="transform"
              type="scale"
              values={`${s.scale * 0.5}; ${s.scale * 1.5}; ${s.scale * 0.8}; ${s.scale * 1.3}; ${s.scale * 0.5}`}
              dur={`${s.dur}s`}
              repeatCount="indefinite"
              begin={`${s.delay}s`}
              additive="sum"
            />
          </g>
        </svg>
      ))}
    </svg>
  );
}

