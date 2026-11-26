"use client";

import type { HomeContent } from "@/lib/shared/content/home-schema";
import { MaskRise, Reveal, Section, SectionHeader, isExternal } from "./section-kit";

/*
 * Contact (docs/screens/HOME_BUSINESS.md §6.6): the headline massive, a short
 * note, the email as the main way in (a signal line traces under it on
 * hover), and the details as a data rail of label | value rows.
 */

type Contact = HomeContent["contact"];

export const Contact = ({ contact }: { contact: Contact }) => (
  <Section id="contact">
    <SectionHeader header={contact.header} />
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
      <div className="flex flex-col gap-8">
        <h3 className="font-wide text-[clamp(2rem,4.6vw,4.4rem)] leading-[1] font-semibold tracking-[-0.02em] uppercase">
          <MaskRise>{contact.headline}</MaskRise>
        </h3>
        <Reveal as="p" delay={0.1} className="max-w-[48ch] font-glyph text-lead text-pretty text-graphite">
          {contact.text}
        </Reveal>
        {contact.email ? (
          <Reveal delay={0.2}>
            <a
              href={`mailto:${contact.email}`}
              className="group relative inline-block font-wide text-[clamp(1rem,1.9vw,1.9rem)] font-semibold [overflow-wrap:anywhere]"
            >
              {contact.email}
              <span aria-hidden className="absolute -bottom-1 left-0 h-0.5 w-full bg-ink/15" />
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-signal transition-transform duration-700 ease-print group-hover:scale-x-100"
              />
            </a>
          </Reveal>
        ) : null}
      </div>
      <dl className="flex flex-col self-end">
        {contact.details.map((detail, index) => (
          <Reveal
            key={`${detail.label}-${index}`}
            delay={index * 0.06}
            className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-t border-ink/15 py-4 last:border-b"
          >
            <dt className="font-technical text-micro text-graphite uppercase">{detail.label}</dt>
            <dd className="text-label font-bold">
              {detail.href ? (
                <a
                  href={detail.href}
                  target={isExternal(detail.href) ? "_blank" : undefined}
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {detail.value}
                </a>
              ) : (
                detail.value
              )}
            </dd>
          </Reveal>
        ))}
      </dl>
    </div>
  </Section>
);
