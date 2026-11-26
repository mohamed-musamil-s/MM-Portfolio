"use client";

import type { HomeContent } from "@/lib/shared/content/home-schema";
import { ContactForm } from "./ContactForm";
import { MaskRise, Parallax, Reveal, Section, SectionHeader, isExternal } from "./section-kit";

/*
 * Contact (docs/screens/HOME_BUSINESS.md §6.6): the headline massive, a short
 * note, the email (a signal line traces under it on hover) and the details as
 * a data rail on the left; the contact form on the right. Messages from the
 * form land in the studio's chat module (docs/features/CONTACT_MESSAGES.md).
 */

type Contact = HomeContent["contact"];

export const Contact = ({ contact }: { contact: Contact }) => (
  <Section id="contact">
    <SectionHeader header={contact.header} />
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
      <Parallax distance={40} className="flex flex-col gap-8">
        <h3 className="font-wide text-[clamp(2rem,4vw,3.8rem)] leading-[1] font-semibold tracking-[-0.02em] uppercase">
          <MaskRise>{contact.headline}</MaskRise>
        </h3>
        <Reveal as="p" delay={0.1} className="max-w-[48ch] font-glyph text-lead text-pretty text-graphite">
          {contact.text}
        </Reveal>
        {contact.email ? (
          <Reveal delay={0.2}>
            <a
              href={`mailto:${contact.email}`}
              className="group relative inline-block font-wide text-[clamp(1rem,1.7vw,1.6rem)] font-semibold [overflow-wrap:anywhere]"
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
        <dl className="mt-2 flex flex-col">
          {contact.details.map((detail, index) => (
            <Reveal
              key={`${detail.label}-${index}`}
              delay={index * 0.06}
              className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-t border-ink/15 py-4 last:border-b"
            >
              <dt className="font-technical text-micro text-graphite uppercase">{detail.label}</dt>
              <dd className="text-label font-bold [overflow-wrap:anywhere]">
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
      </Parallax>
      <Reveal delay={0.15} x={30} y={0}>
        <ContactForm form={contact.form} />
      </Reveal>
    </div>
  </Section>
);
