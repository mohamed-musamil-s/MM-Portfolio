"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTheme } from "@/hooks/useMotionTheme";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Reveal, Section, SectionHeader, TechChip } from "./section-kit";

/*
 * Skills (docs/screens/HOME_BUSINESS.md §6.3): the skill groups as cards on a
 * 3D ring. On large screens the section pins and the ring turns one group to
 * the front per stretch of scroll. On the way in it flies up from flat,
 * spinning, its cards bursting out from the centre over a perspective grid
 * floor; the pointer tilts it. The front group's details and 01–07 jump
 * buttons sit under it. Phones and reduced motion: the cards flip up into
 * place one after another.
 */

type Skills = HomeContent["skills"];
type Group = Skills["groups"][number];

const CARD_W = 320;
const CARD_H = 430;
/** Extra room between neighbouring cards on the ring. */
const RING_GAP = 70;
/** Scroll (in svh) spent per group while the ring turns. */
const SVH_PER_GROUP = 60;
const TILT_DEG = 7;
/** Vertical room kept for the header and the footer row when sizing the ring (px). */
const RING_RESERVED_PX = 300;
/** Viewport width that shows the ring at its base size (px); wider screens get a larger ring. */
const RING_WIDTH_UNIT_PX = 1050;
const RING_MIN_FIT = 0.7;
const RING_MAX_FIT = 1.7;
const TILT_SPRING = { stiffness: 140, damping: 18 } as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** A group's face: index and count, title, note, compact chips. */
const GroupFace = ({ group }: { group: Group }) => (
  <>
    <div className="flex items-center justify-between font-technical text-micro uppercase">
      <span className="text-signal">{group.index}</span>
      <span className={group.dark ? "text-paper/55" : "text-graphite"}>{pad(group.skills.length)} tools</span>
    </div>
    <h3 className="font-wide text-[1.35rem] leading-[1.02] font-semibold tracking-[-0.01em] uppercase">
      {group.title}
    </h3>
    {group.note ? (
      <p className={cn("line-clamp-3 font-glyph text-[0.85rem]", group.dark ? "text-paper/65" : "text-graphite")}>
        {group.note}
      </p>
    ) : null}
    <div className="mt-auto flex flex-wrap gap-1.5">
      {group.skills.map((tech) => (
        <TechChip key={tech.name} tech={tech} dark={group.dark} small />
      ))}
    </div>
  </>
);

const cardClass = (group: Group) =>
  cn(
    "flex flex-col gap-4 rounded-[1.75rem] border p-6",
    group.dark ? "border-ink bg-ink text-paper" : "border-ink/12 bg-paper text-ink",
  );

/** One card on the ring; it brightens as it turns to the front. */
const RingCard = ({
  group,
  index,
  step,
  radius,
  spread,
  turn,
}: {
  group: Group;
  index: number;
  step: number;
  radius: number;
  spread: MotionValue<number>;
  turn: MotionValue<number>;
}) => {
  const transform = useTransform(spread, (s) => `rotateY(${index * step}deg) translateZ(${radius * s}px)`);
  const opacity = useTransform(turn, (degrees) => {
    const facing = ((((index * step + degrees) % 360) + 540) % 360) - 180;
    return 0.3 + 0.7 * Math.max(0, Math.cos((facing * Math.PI) / 180));
  });
  return (
    <motion.article
      style={{ transform, opacity, width: CARD_W, height: CARD_H }}
      className={cn(
        "absolute inset-0 overflow-hidden shadow-[0_40px_80px_-40px_rgb(0_0_0/0.45)] [backface-visibility:hidden]",
        cardClass(group),
      )}
    >
      <GroupFace group={group} />
    </motion.article>
  );
};

/** Scale for the ring so it fits short screens (a motion value, so a resize applies at once). */
const useRingFit = () => {
  const fit = useMotionValue(1);
  useEffect(() => {
    // As large as both the height left under the header and the width allow.
    const measure = () => {
      const byHeight = (window.innerHeight - RING_RESERVED_PX) / CARD_H;
      const byWidth = window.innerWidth / RING_WIDTH_UNIT_PX;
      fit.set(Math.min(RING_MAX_FIT, Math.max(RING_MIN_FIT, Math.min(byHeight, byWidth))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fit]);
  return fit;
};

const Stage = ({ skills }: { skills: Skills }) => {
  const section = useRef<HTMLElement>(null);
  const groups = skills.groups;
  const total = groups.length;
  const step = 360 / total;
  const radius = Math.round(CARD_W / 2 / Math.tan(Math.PI / Math.max(3, total))) + RING_GAP;
  const fit = useRingFit();
  const [front, setFront] = useState(0);

  // The way in: from flat and small, spinning, the cards bursting out of the centre.
  const { scrollYProgress: enter } = useScroll({ target: section, offset: ["start end", "start start"] });
  const intro = useTransform(enter, [0.1, 0.95], [0, 1], { clamp: true });
  const spread = useTransform(intro, [0, 1], [0.04, 1]);
  const scale = useTransform(() => 0.4 + (fit.get() - 0.4) * intro.get());
  const introSpin = useTransform(intro, [0, 1], [-240, 0]);
  const lift = useTransform(intro, [0, 1], [64, -6]);
  const floorOpacity = useTransform(intro, [0.3, 1], [0, 1]);

  // While pinned: one group to the front per stretch of scroll.
  const { scrollYProgress: pinned } = useScroll({ target: section, offset: ["start start", "end end"] });
  const spin = useSpring(useTransform(pinned, [0, 1], [0, -(total - 1) * step]), { stiffness: 110, damping: 22 });
  const turn = useTransform(() => spin.get() + introSpin.get());
  const floorShift = useTransform(pinned, [0, 1], ["0px", "-960px"]);
  useMotionValueEvent(pinned, "change", (value) => setFront(Math.min(total - 1, Math.round(value * (total - 1)))));

  // The pointer tilts the ring a little.
  const tiltX = useSpring(0, TILT_SPRING);
  const tiltY = useSpring(0, TILT_SPRING);
  const rotateX = useTransform(() => lift.get() + tiltX.get());
  const rotateY = useTransform(() => turn.get() + tiltY.get());
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - box.left) / box.width - 0.5) * TILT_DEG * 2);
    tiltX.set(-((event.clientY - box.top) / box.height - 0.5) * TILT_DEG);
  };
  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  /** Scroll so the given group faces front. */
  const showGroup = (index: number) => {
    const box = section.current;
    if (!box) {
      return;
    }
    const travel = box.offsetHeight - window.innerHeight;
    window.scrollTo({ top: box.offsetTop + (travel * index) / Math.max(1, total - 1), behavior: "smooth" });
  };

  const current = groups[front] ?? groups[0];

  return (
    <section
      ref={section}
      id="skills"
      className="relative scroll-mt-20 bg-paper"
      style={{ height: `${100 + (total - 1) * SVH_PER_GROUP}svh` }}
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-clip px-page pt-[clamp(1.25rem,3svh,2rem)] pb-6">
        <div className="relative z-10 mx-auto w-full max-w-[1440px]">
          <SectionHeader header={skills.header} compact />
        </div>

        {/* The 3D stage. */}
        <div
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative -mt-6 flex-1 [perspective-origin:50%_35%] [perspective:1700px]"
        >
          {/* A grid floor running away under the ring, and a signal glow where the ring stands. */}
          <motion.div
            aria-hidden
            style={{ opacity: floorOpacity, backgroundPositionY: floorShift }}
            className="absolute -inset-x-1/2 bottom-[-28%] h-[85%] [transform:rotateX(76deg)] bg-[linear-gradient(to_right,color-mix(in_srgb,var(--text-primary)_18%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--text-primary)_18%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_50%_20%,black_10%,transparent_65%)] bg-size-[80px_80px]"
          />
          <motion.div
            aria-hidden
            style={{ opacity: floorOpacity }}
            className="absolute bottom-[4%] left-1/2 h-24 w-[46rem] -translate-x-1/2 rounded-[50%] bg-signal/25 blur-3xl"
          />
          <div
            className="absolute top-[46%] left-1/2 [transform-style:preserve-3d]"
            style={{ width: CARD_W, height: CARD_H, marginLeft: -CARD_W / 2, marginTop: -CARD_H / 2 }}
          >
            <motion.div
              style={{ rotateX, rotateY, scale, z: -radius }}
              className="relative size-full [transform-style:preserve-3d]"
            >
              {groups.map((group, index) => (
                <RingCard
                  key={`${group.title}-${index}`}
                  group={group}
                  index={index}
                  step={step}
                  radius={radius}
                  spread={spread}
                  turn={turn}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* The front group, and the way to the others. */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-end justify-between gap-8">
          <div className="flex items-end gap-5">
            <span className="font-wide text-[clamp(3rem,6vw,5.5rem)] leading-[0.8] font-semibold text-transparent [-webkit-text-stroke:1.5px_var(--text-primary)]">
              {current?.index}
            </span>
            <div className="flex max-w-[34ch] flex-col gap-1.5 pb-1">
              <motion.span
                key={current?.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_PRINT }}
                className="font-wide text-lg leading-tight font-semibold uppercase"
              >
                {current?.title}
              </motion.span>
              <span className="font-technical text-micro text-graphite uppercase">{skills.legend.summary}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-1.5">
              {groups.map((group, index) => (
                <button
                  key={`${group.title}-${index}`}
                  type="button"
                  onClick={() => showGroup(index)}
                  aria-label={`Show ${group.title}`}
                  aria-current={index === front ? "true" : undefined}
                  className={cn(
                    "grid size-9 place-items-center rounded-full border font-technical text-micro transition-colors duration-300 ease-print focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
                    index === front ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink",
                  )}
                >
                  {group.index}
                </button>
              ))}
            </div>
            <Legend legend={skills.legend} />
          </div>
        </div>
      </div>
    </section>
  );
};

const Legend = ({ legend }: { legend: Skills["legend"] }) => (
  <span className="flex flex-wrap items-center gap-x-5 gap-y-1 font-technical text-micro uppercase">
    <span className="flex items-center gap-2">
      <span aria-hidden className="size-3 rounded-full border border-signal" />
      {legend.core}
    </span>
    <span className="flex items-center gap-2 text-graphite">
      <span aria-hidden className="size-3 rounded-full border border-ink/20" />
      {legend.other}
    </span>
  </span>
);

/** Phones and reduced motion: the cards flip up into place in turn. */
const Deck = ({ skills }: { skills: Skills }) => (
  <Section id="skills">
    <SectionHeader header={skills.header} />
    <Reveal y={0} className="mb-8 flex flex-col gap-2">
      <Legend legend={skills.legend} />
      <span className="font-technical text-micro text-graphite uppercase">{skills.legend.summary}</span>
    </Reveal>
    <div className="grid gap-4 [perspective:1200px] md:grid-cols-2">
      {skills.groups.map((group, index) => (
        <motion.article
          key={`${group.title}-${index}`}
          initial={{ opacity: 0, rotateX: -55, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.9, delay: (index % 2) * 0.08, ease: EASE_PRINT }}
          className={cn("origin-top", cardClass(group))}
        >
          <GroupFace group={group} />
        </motion.article>
      ))}
    </div>
  </Section>
);

export const Skills = ({ skills }: { skills: Skills }) => {
  const wide = useMediaQuery("(min-width: 1024px)");
  const { reducedMotion } = useMotionTheme();
  return wide && !reducedMotion ? <Stage skills={skills} /> : <Deck skills={skills} />;
};
