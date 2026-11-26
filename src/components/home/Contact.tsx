"use client";

import type { HomeContent } from "@/lib/shared/content/home-schema";
import { ChatForm } from "./ChatForm";
import { MaskRise, Reveal, Section, SectionHeader, isExternal } from "./section-kit";

/*
 * Contact (docs/screens/HOME_BUSINESS.md §6.7): the headline huge across the
 * top with the note under it; then the conversation (ChatForm, the contact
 * form told as a chat) beside a column with the email big and the details as
 * a data rail. Messages land in the studio's chat module
 * (docs/features/CONTACT_MESSAGES.md).
 */

type Contact = HomeContent["contact"];

/** `owner` is the site owner's name, shown as who the chat is with. */
export const Contact = ({ contact, owner }: { contact: Contact; owner: string }) => (
  <Section id="contact">
    <SectionHeader header={contact.header} />
    <div className="mb-[clamp(2.5rem,7svh,4.5rem)] flex flex-col gap-6">
      <h3 className="max-w-[18ch] font-wide text-[clamp(2.2rem,6vw,6rem)] leading-[0.95] font-semibold tracking-[-0.02em] uppercase">
        <MaskRise>{contact.headline}</MaskRise>
      </h3>
      <Reveal as="p" delay={0.1} className="max-w-[52ch] font-glyph text-lead text-pretty text-graphite">
        {contact.text}
      </Reveal>
    </div>

    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
      <Reveal y={40}>
        <ChatForm form={contact.form} host={owner} />
      </Reveal>
      <div className="flex flex-col gap-8">
        {contact.email ? (
          <Reveal delay={0.15}>
            <a
              href={`mailto:${contact.email}`}
              className="group relative inline-block font-wide text-[clamp(0.95rem,1.25vw,1.25rem)] font-semibold [overflow-wrap:anywhere]"
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
        <dl className="flex flex-col">
          {contact.details.map((detail, index) => (
            <Reveal
              key={`${detail.label}-${index}`}
              delay={0.2 + index * 0.06}
              className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-t border-ink/15 py-4 last:border-b"
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
      </div>
    </div>
  </Section>
);
