"use client";

import { useEffect, useRef } from "react";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";

/*
 * Halftone sphere (Canvas 2D). A fixed screen of dots inside a circle; each
 * dot's radius is the Lambert shading of a lit globe at that point, so the
 * field reads as a printed sphere. The globe turns slowly: one meridian is
 * drawn in signal orange and sweeps around it. The light leans toward the
 * pointer. Outside the sphere, a faint dot screen continues as paper texture.
 *
 * Colours come from the surface tokens (--text-primary, --signal). Purely
 * decorative; renders one static frame under reduced motion.
 */

/** Dots across the sphere's diameter. */
const GRID = 38;
/** Radians per millisecond. */
const SPIN_SPEED = 0.00018;
/** Axis tilt toward the viewer, radians. */
const TILT = 0.42;
/** Half-width of the orange meridian band, in radians of longitude. */
const MERIDIAN_WIDTH = 0.09;
const POINTER_EASE = 0.06;

type Vec3 = { x: number; y: number; z: number };

const normalize = ({ x, y, z }: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length };
};

export const HalftoneSphere = ({ className }: { className?: string }) => {
  const { reducedMotion } = useMotionTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const styles = getComputedStyle(canvas);
    const ink = styles.getPropertyValue("--text-primary").trim() || "#0a0a0a";
    const signal = styles.getPropertyValue("--signal").trim() || "#e8480f";
    const size = { width: 0, height: 0 };
    const pointer = { x: 0, y: 0 };
    const lean = { x: 0, y: 0 };
    let frame = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.width = box.width;
      size.height = box.height;
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const { width, height } = size;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.44;
      const cx = width / 2;
      const cy = height / 2;
      const step = (radius * 2) / GRID;
      const maxDot = step * 0.46;
      const spin = time * SPIN_SPEED;
      const light = normalize({ x: -0.45 + lean.x * 0.7, y: -0.55 + lean.y * 0.7, z: 0.75 });
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);

      // Paper screen around the sphere: tiny, faint dots.
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.1;
      const outerCols = Math.ceil(width / step);
      const outerRows = Math.ceil(height / step);
      for (let row = 0; row <= outerRows; row += 1) {
        for (let col = 0; col <= outerCols; col += 1) {
          const x = col * step + ((cx % step) - step / 2);
          const y = row * step + ((cy % step) - step / 2);
          if (Math.hypot(x - cx, y - cy) < radius + step) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(x, y, step * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // The sphere.
      for (let row = 0; row < GRID; row += 1) {
        for (let col = 0; col < GRID; col += 1) {
          const nx = ((col + 0.5) / GRID) * 2 - 1;
          const ny = ((row + 0.5) / GRID) * 2 - 1;
          const d2 = nx * nx + ny * ny;
          if (d2 > 1) {
            continue;
          }
          const nz = Math.sqrt(1 - d2);
          const shade = Math.max(0, nx * light.x + ny * light.y + nz * light.z);

          // Into the globe's frame: undo the tilt, then the spin, to get longitude.
          const y1 = ny * cosT - nz * sinT;
          const z1 = ny * sinT + nz * cosT;
          const lon = Math.atan2(nx, z1) - spin;
          const wrapped = Math.atan2(Math.sin(lon), Math.cos(lon));
          const onMeridian = Math.abs(wrapped) < MERIDIAN_WIDTH && Math.abs(y1) < 0.98;

          const dot = maxDot * (0.12 + 0.88 * Math.pow(shade, 1.15));
          ctx.fillStyle = onMeridian ? signal : ink;
          ctx.globalAlpha = onMeridian ? 1 : 0.92;
          ctx.beginPath();
          ctx.arc(cx + nx * radius, cy + ny * radius, onMeridian ? Math.max(dot, maxDot * 0.55) : dot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (time: number) => {
      lean.x += (pointer.x - lean.x) * POINTER_EASE;
      lean.y += (pointer.y - lean.y) * POINTER_EASE;
      draw(time);
      frame = requestAnimationFrame(tick);
    };

    const handlePointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    resize();
    draw(0); // first frame immediately, even before the animation loop runs
    const observer = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    observer.observe(canvas);

    if (!reducedMotion) {
      frame = requestAnimationFrame(tick);
      window.addEventListener("pointermove", handlePointer, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointer);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block size-full", className)} />;
};
