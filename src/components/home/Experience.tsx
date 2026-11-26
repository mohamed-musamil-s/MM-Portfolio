"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StatusDot } from "@/components/motion/StatusDot";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/shared/cn";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { Bold, Section, SectionHeader, TechChip, isExternal } from "./section-kit";

/*
 * Experience (docs/screens/HOME_BUSINESS.md §6.2): the roles as a horizontal
 * accordion of tall panels. The open role fills the row in ink: period, place
 * and length, company, the title massive, highlights in two columns and the
 * stack. The others fold to slim strips with the company running up the side.
 * Hover (with a short intent delay), click or focus opens a strip. The panels
 * wipe up one after another on the way in. Phones: a vertical accordion.
 */

type Experience = HomeContent["experience"];
type Role = Experience["roles"][number];

const HOVER_INTENT_MS = 140;
const PANEL_SPRING = { type: "spring", stiffness: 160, damping: 26 } as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** The first year in a period ("Sep 2025 — Present" → "2025"). */
const startYear = (period: string) => period.match(/\d{4}/)?.[0] ?? "";

/** Folded strip width plus the gap after it, in px (6.5rem + 0.75rem). */
const FOLD_PX = 116;

const CompanyName = ({ role, className }: { role: Role; className?: string }) =>
  role.url ? (
    <a
      href={role.url}
      target={isExternal(role.url) ? "_blank" : undefined}
      rel="noreferrer"
      className={cn("underline-offset-4 hover:underline", className)}
    >
      {role.company}
    </a>
  ) : (
    <span className={className}>{role.company}</span>
  );

/** The open role's full story. */
const RoleDetail = ({ role, index, total }: { role: Role; index: number; total: number }) => (
  <div className="flex h-full flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-4 font-technical text-micro text-paper/60 uppercase">
      <span className="flex items-center gap-2">
        {role.current ? <StatusDot /> : null}
        <span className={role.current ? "text-paper" : undefined}>{role.period}</span>
        <span aria-hidden>·</span>
        {role.duration}
      </span>
      <span>
        {role.location} — {pad(index + 1)} / {pad(total)}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {role.logo ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper p-2">
          <Image src={role.logo} alt="" width={28} height={28} unoptimized className="size-7 object-contain" />
        </span>
      ) : null}
      <CompanyName role={role} className="font-wide text-xl font-semibold uppercase" />
    </div>
    <h3 className="font-wide text-[clamp(2rem,4.4vw,4.4rem)] leading-[0.92] font-semibold tracking-[-0.02em] uppercase">
      {role.title}
    </h3>
    <ul className="grid gap-x-10 gap-y-3 xl:grid-cols-2">
      {role.highlights.map((highlight, item) => (
        <li key={item} className="flex gap-3 font-glyph text-[0.98rem] leading-relaxed text-paper/70">
          <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-signal" />
          <span>
            <Bold text={highlight} strongClassName="text-paper" />
          </span>
        </li>
      ))}
    </ul>
    {role.stack.length > 0 ? (
      <div className="mt-auto flex flex-wrap gap-1.5">
        {role.stack.map((tech) => (
          <TechChip key={tech.name} tech={tech} dark small />
        ))}
      </div>
    ) : null}
  </div>
);

/** Large screens: the row of panels. */
const Panels = ({ roles }: { roles: Role[] }) => {
  const initial = Math.max(
    0,
    roles.findIndex((role) => role.current),
  );
  const [open, setOpen] = useState(initial);
  const intent = useRef<number | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);

  // The open story is laid out at its final width up front, so it never reflows while its panel grows.
  useEffect(() => {
    const element = row.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setRowWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const detailWidth = Math.max(0, rowWidth - (roles.length - 1) * FOLD_PX);

  const clearIntent = () => {
    if (intent.current !== null) {
      window.clearTimeout(intent.current);
      intent.current = null;
    }
  };
  const openSoon = (index: number) => {
    clearIntent();
    intent.current = window.setTimeout(() => setOpen(index), HOVER_INTENT_MS);
  };
  useEffect(() => clearIntent, []);

  return (
    <div ref={row} className="flex h-[min(78svh,700px)] min-h-[560px] gap-3" onPointerLeave={clearIntent}>
      {roles.map((role, index) => {
        const active = index === open;
        return (
          <motion.div
            key={`${role.company}-${role.title}`}
            initial={{ clipPath: "inset(100% 0% 0% 0% round 2rem)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0% round 2rem)" }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            animate={{ flexGrow: active ? 1 : 0 }}
            transition={{ flexGrow: PANEL_SPRING, clipPath: { delay: index * 0.12, duration: 1.1, ease: EASE_PRINT } }}
            onPointerEnter={() => openSoon(index)}
            className={cn(
              "relative min-w-0 basis-[6.5rem] overflow-hidden rounded-[2rem] transition-colors duration-500 ease-print",
              active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink/5",
            )}
          >
            {/* The fold: company up the side, number on top, period at the foot. */}
            <button
              type="button"
              aria-expanded={active}
              aria-controls={`role-${index}`}
              aria-label={`${role.title}, ${role.company}`}
              onClick={() => setOpen(index)}
              onFocus={() => setOpen(index)}
              tabIndex={active ? -1 : 0}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-between py-7 transition-opacity duration-300 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-signal",
                active ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              <span className="font-technical text-micro text-signal">{pad(index + 1)}</span>
              <span className="flex rotate-180 items-center gap-4 [writing-mode:vertical-rl]">
                <span className="font-wide text-[1.35rem] font-semibold whitespace-nowrap uppercase">
                  {role.company}
                </span>
                <span className="font-technical text-micro whitespace-nowrap text-graphite uppercase">
                  {role.title}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {role.current ? <StatusDot /> : null}
                <span className="font-technical text-[0.65rem] text-graphite">{startYear(role.period)}</span>
              </span>
            </button>

            {/* The open story. */}
            <div
              id={`role-${index}`}
              inert={!active}
              style={{ width: detailWidth || undefined }}
              className="absolute inset-y-0 left-0 p-10"
            >
              <AnimatePresence>
                {active ? (
                  <motion.div
                    key="detail"
                    className="h-full"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.18, duration: 0.6, ease: EASE_PRINT } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <RoleDetail role={role} index={index} total={roles.length} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* The number, giant and outlined, behind the open story. */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -right-4 -bottom-10 font-wide text-[14rem] leading-none font-semibold text-transparent transition-opacity duration-700 [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--bg-primary)_14%,transparent)]",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              {pad(index + 1)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

/** Phones: a vertical accordion; the current role starts open. */
const Stack = ({ roles }: { roles: Role[] }) => {
  const [open, setOpen] = useState(
    Math.max(
      0,
      roles.findIndex((role) => role.current),
    ),
  );
  return (
    <div className="flex flex-col gap-3">
      {roles.map((role, index) => {
        const active = index === open;
        return (
          <motion.div
            key={`${role.company}-${role.title}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.8, ease: EASE_PRINT }}
            className={cn(
              "overflow-hidden rounded-[1.75rem] transition-colors duration-500",
              active ? "bg-ink text-paper" : "bg-paper text-ink",
            )}
          >
            <button
              type="button"
              aria-expanded={active}
              aria-controls={`role-m-${index}`}
              onClick={() => setOpen(active ? -1 : index)}
              className="flex w-full items-center gap-4 p-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-signal"
            >
              <span className="font-technical text-micro text-signal">{pad(index + 1)}</span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="font-wide text-lg leading-tight font-semibold uppercase">{role.company}</span>
                <span className={cn("font-technical text-micro uppercase", active ? "text-paper/60" : "text-graphite")}>
                  {role.title} · {role.period}
                </span>
              </span>
              <motion.span aria-hidden animate={{ rotate: active ? 45 : 0 }} className="text-xl">
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {active ? (
                <motion.div
                  id={`role-m-${index}`}
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE_PRINT }}
                >
                  <div className="px-5 pb-6">
                    <RoleDetail role={role} index={index} total={roles.length} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export const Experience = ({ experience }: { experience: Experience }) => {
  const wide = useMediaQuery("(min-width: 1024px)");
  return (
    <Section id="experience" className="bg-newsprint">
      <SectionHeader header={experience.header} />
      {wide ? <Panels roles={experience.roles} /> : <Stack roles={experience.roles} />}
    </Section>
  );
};
