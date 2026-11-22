"use client";

import { motion, useTransform } from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/shared/cn";

/*
 * 3D-look stage for the maintenance film (docs/screens/MAINTENANCE_BUSINESS.md §5.4).
 * Pure CSS 3D (preserve-3d), no WebGL: the film plays on the front of an
 * extruded slab, and four props float at different depths around it:
 * a cube with a signal top, an extruded signal gear, a lit orb and the
 * "next version" chip.
 *
 * Layers, outside in (each owned by exactly one animation system):
 *   tilt   motion springs: rests at a three-quarter view, leans to the pointer
 *   sway   GSAP: slow idle drift
 *   lift   GSAP: on every status check it rises toward the camera, a scan
 *          beam sweeps the screen, an outline pulses and the props hop
 *
 * Light comes from the top left: the top face is the lightest, the visible
 * right face is dark with a signal edge strip. Reduced motion: a still,
 * three-quarter view.
 */

type DepthStageProps = {
  children: ReactNode;
  /** True while a status check is in flight; each rising edge plays the check sequence. */
  checking: boolean;
  /** Text on the floating chip (database content). */
  chipLabel: string;
  className?: string;
};

/** Slab thickness, px. */
const DEPTH = 34;
/** Three-quarter view from above and to the right: the top and right faces show. */
const REST = { rotateX: -10, rotateY: -19 } as const;
/** Max pointer lean, degrees. */
const LEAN = 9;

const face = (transform: string, extra?: CSSProperties): CSSProperties => ({ transform, ...extra });

/** Cube: six faces around its centre; `--cube` is the edge length. */
const CUBE_FACES = [
  { transform: "translateZ(calc(var(--cube) / 2))", tone: "bg-paper" },
  { transform: "rotateY(180deg) translateZ(calc(var(--cube) / 2))", tone: "bg-newsprint" },
  { transform: "rotateY(90deg) translateZ(calc(var(--cube) / 2))", tone: "bg-newsprint" },
  { transform: "rotateY(-90deg) translateZ(calc(var(--cube) / 2))", tone: "bg-newsprint" },
  { transform: "rotateX(90deg) translateZ(calc(var(--cube) / 2))", tone: "bg-signal" },
  { transform: "rotateX(-90deg) translateZ(calc(var(--cube) / 2))", tone: "bg-ink" },
] as const;

const GEAR_LAYERS = 6;
const gearPath = (teeth: number, rInner: number, rOuter: number): string => {
  const step = (Math.PI * 2) / teeth;
  const point = (r: number, a: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  return `${Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return `${i === 0 ? "M" : "L"}${point(rInner, a)}L${point(rOuter, a + step * 0.12)}L${point(rOuter, a + step * 0.42)}L${point(rInner, a + step * 0.54)}`;
  }).join("")}ZM50 32a18 18 0 1 0 0.01 0Z`;
};
const GEAR = gearPath(10, 40, 49);

const Cube = () => (
  <div data-stage-spin="cube" className="relative size-(--cube) transform-3d">
    {CUBE_FACES.map(({ transform, tone }) => (
      <div key={transform} className={cn("absolute inset-0 border-[1.5px] border-ink", tone)} style={face(transform)} />
    ))}
  </div>
);

const Gear = () => (
  <div data-stage-spin="gear" className="relative size-(--gear) transform-3d">
    {Array.from({ length: GEAR_LAYERS }, (_, i) => (
      <svg
        key={i}
        viewBox="0 0 100 100"
        fillRule="evenodd"
        className={cn("absolute inset-0 size-full", i === GEAR_LAYERS - 1 ? "fill-signal" : "fill-ink")}
        style={face(`translateZ(${i * 2}px)`)}
      >
        <path d={GEAR} />
      </svg>
    ))}
  </div>
);

const Orb = () => (
  <div className="size-(--orb) rounded-full bg-radial-[at_32%_28%] from-paper via-signal to-ink shadow-[0_18px_30px_-12px] shadow-ink/40" />
);

const Chip = ({ label }: { label: string }) => (
  <div className="relative transform-3d">
    <div className="absolute inset-0 bg-ink" style={face("translateZ(-8px)")} />
    <div className="absolute top-0 right-0 h-full w-2 origin-right bg-ink" style={face("rotateY(-90deg)")} />
    <div className="absolute top-0 left-0 h-2 w-full origin-top bg-graphite" style={face("rotateX(-90deg)")} />
    <div className="relative border-[1.5px] border-ink bg-signal px-[2.2cqmin] py-[1.2cqmin] font-technical text-[2.6cqmin] leading-none font-medium tracking-[0.2em] text-paper">
      {label}
    </div>
  </div>
);

/** A floating prop: placed on the slab plane, pushed toward the camera by `z` px. */
const PROPS = [
  { key: "cube", z: 110, position: "-top-[7%] -right-[5%]", bob: 7, node: <Cube /> },
  { key: "gear", z: 70, position: "-bottom-[9%] -left-[6%]", bob: 5, node: <Gear /> },
  { key: "orb", z: 140, position: "top-[14%] -left-[8%]", bob: 10, node: <Orb /> },
] as const;

export const DepthStage = ({ children, checking, chipLabel, className }: DepthStageProps) => {
  const { reducedMotion } = useMotionTheme();
  const scopeRef = useRef<HTMLDivElement>(null);
  const loops = useRef<{ spins: gsap.core.Tween[] }>({ spins: [] });
  const lean = usePointerParallax(LEAN);
  const rotateY = useTransform(lean.x, (value) => REST.rotateY + value);
  const rotateX = useTransform(lean.y, (value) => REST.rotateX - value * 0.7);
  const shadowX = useTransform(lean.x, (value) => value * -2.4);

  // Idle loops: drift, bobbing props, spinning cube and gear.
  useGSAP(
    () => {
      const q = gsap.utils.selector(scopeRef);
      q("[data-stage-prop]").forEach((element) => gsap.set(element, { z: Number(element.dataset.z) }));
      if (reducedMotion) {
        gsap.set(q('[data-stage-spin="cube"]'), { rotationX: -24, rotationY: 34 });
        return;
      }
      gsap.to(q("[data-stage-sway]"), {
        rotationY: 4,
        rotationX: -2,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      q("[data-stage-bob]").forEach((element, i) =>
        gsap.to(element, {
          y: -Number(element.dataset.bob),
          duration: 2.2 + i * 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }),
      );
      gsap.set(q('[data-stage-spin="cube"]'), { rotationX: -24 });
      loops.current.spins = [
        gsap.to(q('[data-stage-spin="cube"]'), { rotationY: "+=360", duration: 14, ease: "none", repeat: -1 }),
        gsap.to(q('[data-stage-spin="gear"]'), { rotation: "+=360", duration: 10, ease: "none", repeat: -1 }),
      ];
    },
    { scope: scopeRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  // Check sequence on every rising edge of `checking`.
  useGSAP(
    () => {
      if (!checking || reducedMotion) {
        return;
      }
      const q = gsap.utils.selector(scopeRef);
      const spins = loops.current.spins;
      gsap
        .timeline()
        .to(spins, { timeScale: 6, duration: 0.3, ease: "power2.out" }, 0)
        .to(q("[data-stage-lift]"), { z: 46, rotationY: 10, duration: 0.45, ease: "power3.out" }, 0)
        .fromTo(
          q("[data-stage-scan]"),
          { yPercent: -100, autoAlpha: 1 },
          { yPercent: 560, duration: 1, ease: "power1.inOut" },
          0.1,
        )
        .to(q("[data-stage-scan]"), { autoAlpha: 0, duration: 0.2 }, 1)
        .fromTo(
          q("[data-stage-pulse]"),
          { scale: 1, autoAlpha: 0.9 },
          { scale: 1.07, autoAlpha: 0, duration: 0.7, ease: "power2.out" },
          1.05,
        )
        .to(
          q("[data-stage-hop]"),
          { y: -16, duration: 0.18, ease: "power2.out", stagger: 0.06, yoyo: true, repeat: 1 },
          1.05,
        )
        .to(q("[data-stage-lift]"), { z: 0, rotationY: 0, duration: 0.8, ease: "power3.inOut" }, 1.3)
        .to(spins, { timeScale: 1, duration: 0.8, ease: "power2.inOut" }, 1.3);
    },
    { scope: scopeRef, dependencies: [checking, reducedMotion] },
  );

  return (
    <div
      ref={scopeRef}
      className={cn(
        "[container-type:size] relative grid place-items-center [--cube:9cqmin] [--gear:15cqmin] [--orb:7.5cqmin]",
        className,
      )}
    >
      {/* Floor shadow (2D, drifts against the lean) */}
      <motion.div
        aria-hidden
        className="absolute bottom-[3%] left-[14%] h-[9%] w-[72%] rounded-[50%] bg-ink/20 blur-2xl"
        style={{ x: shadowX }}
      />

      <div className="aspect-24/17 w-[min(82cqw,calc(82cqh*24/17))] perspective-[1400px]">
        <motion.div className="relative size-full transform-3d" style={{ rotateX, rotateY }}>
          <div data-stage-sway className="absolute inset-0 transform-3d">
            <div data-stage-lift className="absolute inset-0 transform-3d">
              {/* Extruded slab */}
              <div className="absolute inset-0 bg-ink" style={face(`translateZ(${-DEPTH}px)`)} />
              <div
                className="absolute top-0 left-0 h-full origin-left bg-ink"
                style={face("rotateY(90deg)", { width: DEPTH })}
              />
              <div
                className="absolute top-0 right-0 h-full origin-right border-[1.5px] border-ink bg-graphite"
                style={face("rotateY(-90deg)", { width: DEPTH })}
              >
                <span className="absolute inset-y-[12%] left-1/2 w-0.5 -translate-x-1/2 bg-signal" />
              </div>
              <div
                className="absolute top-0 left-0 w-full origin-top border-[1.5px] border-ink bg-newsprint"
                style={face("rotateX(-90deg)", { height: DEPTH })}
              >
                <span className="absolute inset-0 bg-linear-to-r from-transparent to-ink/15" />
              </div>
              <div
                className="absolute bottom-0 left-0 w-full origin-bottom bg-ink"
                style={face("rotateX(90deg)", { height: DEPTH })}
              />

              {/* Screen (front face) */}
              <div className="absolute inset-0 overflow-hidden border-[1.5px] border-ink bg-paper">
                {children}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-transparent via-transparent to-ink/8" />
                <div
                  data-stage-scan
                  className="invisible absolute inset-x-0 top-0 h-[18%] border-b-2 border-signal bg-linear-to-b from-transparent to-signal/25"
                />
              </div>
              <div data-stage-pulse className="invisible absolute inset-0 border-2 border-signal" />

              {/* Floating props */}
              {PROPS.map(({ key, z, position, bob, node }) => (
                <div key={key} data-stage-prop data-z={z} className={cn("absolute transform-3d", position)}>
                  <div data-stage-hop className="transform-3d">
                    <div data-stage-bob data-bob={bob} className="transform-3d">
                      {node}
                    </div>
                  </div>
                </div>
              ))}
              <div data-stage-prop data-z={90} className="absolute -right-[9%] bottom-[16%] transform-3d">
                <div data-stage-hop className="transform-3d">
                  <div data-stage-bob data-bob={6} className="transform-3d">
                    <Chip label={chipLabel} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
