"use client";
import React, { useState, useEffect } from "react";

export function RandomStars() {
  const [stars, setStars] = useState<
    { id: number; cx: number; cy: number; scale: number; dur: number }[]
  >([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Create exactly 6 star slots
    const initialStars = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      cx: 5 + Math.random() * 90,
      cy: 5 + Math.random() * 90,
      scale: 0.2 + Math.random() * 0.4,
      dur: 2 + Math.random() * 1.5,
    }));

    setStars(initialStars);

    const interval = setInterval(() => {
      setStars((prev) => {
        const next = [...prev];
        const indexToRespawn = Math.floor(Math.random() * 6);
        next[indexToRespawn] = {
          id: prev[indexToRespawn].id,
          cx: 5 + Math.random() * 90,
          cy: 5 + Math.random() * 90,
          scale: 0.2 + Math.random() * 0.4,
          dur: 2 + Math.random() * 1.5,
        };
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

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
      {stars.map((s) => (
        <svg
          key={`${s.id}-${s.cx}-${s.cy}`}
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
              repeatCount="1"
              fill="freeze"
            />
            <animateTransform
              attributeName="transform"
              type="scale"
              values={`${s.scale * 0.5}; ${s.scale * 1.5}; ${s.scale * 0.8}; ${s.scale * 1.3}; ${s.scale * 0.5}`}
              dur={`${s.dur}s`}
              repeatCount="1"
              fill="freeze"
              additive="sum"
            />
          </g>
        </svg>
      ))}
    </svg>
  );
}
