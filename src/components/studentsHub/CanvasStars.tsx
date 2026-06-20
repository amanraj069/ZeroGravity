"use client";

import React, { useRef, useEffect } from "react";

export interface Star {
  left: string;
  top: string;
  size: number;
  opacity: number;
  delay: number;
  twinkleDuration: number;
  twinkleDelay: number;
  moveX: number;
  moveY: number;
}

interface CanvasStarsProps {
  stars: Star[];
}

export const CanvasStars: React.FC<CanvasStarsProps> = ({ stars }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Find the parent verification card to track hover
    const card = canvas.closest(".verification-card") as HTMLElement;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isHovered = false;
    let resizeObserver: ResizeObserver | null = null;

    const handleMouseEnter = () => {
      isHovered = true;
    };
    
    const handleMouseLeave = () => {
      isHovered = false;
    };

    if (card) {
      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);
    }

    const setCanvasSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      // Increase pixel density for retina displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        setCanvasSize();
      });
      resizeObserver.observe(canvas);
    } else {
      setCanvasSize();
      window.addEventListener("resize", setCanvasSize);
    }

    let currentProgress = 0;
    const startTime = performance.now();

    const render = (time: number) => {
      const t = (time - startTime) / 1000;
      const { width, height } = canvas.getBoundingClientRect();
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Lerp hover progress (ease out)
      const targetProgress = isHovered ? 1 : 0;
      currentProgress += (targetProgress - currentProgress) * 0.15;

      stars.forEach((star) => {
        let alpha = 0;
        
        // Wait for appear delay (0.1s multiplier matches CSS)
        const appearDelay = star.delay * 0.1;
        if (t > appearDelay) {
          // Twinkling logic (sine wave)
          const phase = ((t - appearDelay - star.twinkleDelay) / star.twinkleDuration) * Math.PI * 2;
          // CSS had 0.2 min, 1.0 max. Sin is -1 to 1.
          // (sin + 1) / 2 goes from 0 to 1
          // so 0.2 + 0.8 * ((sin + 1) / 2)
          const normalizedSin = (Math.sin(phase) + 1) / 2;
          const twinkle = 0.2 + 0.8 * normalizedSin;
          
          // Apply initial fade in (0 to 1 over 0.5s matching CSS animation verificationStarFadeIn)
          const fadeInProgress = Math.min(1, (t - appearDelay) / 0.5);
          
          alpha = star.opacity * twinkle * fadeInProgress;
        }

        // Calculate base position from percentages
        const baseX = (parseFloat(star.left) / 100) * width;
        const baseY = (parseFloat(star.top) / 100) * height;

        // Apply hover translation
        const x = baseX + star.moveX * currentProgress;
        const y = baseY + star.moveY * currentProgress;

        ctx.beginPath();
        ctx.arc(x, y, star.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", setCanvasSize);
      }
      if (card) {
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [stars]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none" 
    />
  );
};
