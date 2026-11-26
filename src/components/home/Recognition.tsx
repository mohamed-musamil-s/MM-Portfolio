"use client";

import type { HomeContent } from "@/lib/shared/content/home-schema";
import { Parallax, Reveal, Section, SectionHeader } from "./section-kit";

/*
 * Recognition (docs/screens/HOME_BUSINESS.md §6.5): awards as badge cards
 * coming in diagonally, education as a short list, kind words as large quotes.
 */

type Recognition = HomeContent["recognition"];

const Label = ({ children }: { children: string }) => (
  <Reveal y={0} className="mb-6 font-technical text-micro text-graphite uppercase">
    {children}
  </Reveal>
);

export const Recognition = ({ recognition }: { recognition: Recognition }) => (
  <Section id="recognition" className="bg-newsprint/40">
    <SectionHeader header={recognition.header} />

    {recognition.awards.length > 0 ? (
      <>
        <Label>{recognition.awardsLabel}</Label>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recognition.awards.map((award, index) => (
            <Reveal
              key={`${award.title}-${index}`}
              as="article"
              delay={(index % 3) * 0.08}
              x={-30}
              y={30}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-ink/10 bg-paper p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-full border-2 border-signal font-wide text-sm font-semibold text-signal">
                  {award.badge}
                </span>
                {award.year ? <span className="font-technical text-micro text-graphite">{award.year}</span> : null}
              </div>
              <h3 className="font-wide text-lg leading-tight font-semibold uppercase">{award.title}</h3>
              <span className="font-technical text-micro text-graphite uppercase">{award.org}</span>
              {award.text ? <p className="font-glyph text-[0.95rem] text-graphite">{award.text}</p> : null}
            </Reveal>
          ))}
        </div>
      </>
    ) : null}

    <div className="mt-[clamp(3rem,8svh,5rem)] grid gap-12 lg:grid-cols-2 lg:gap-20">
      {recognition.education.length > 0 ? (
        <div>
          <Label>{recognition.educationLabel}</Label>
          <ul className="flex flex-col">
            {recognition.education.map((item, index) => (
              <Reveal
                key={`${item.title}-${index}`}
                as="li"
                delay={index * 0.08}
                className="flex items-center gap-5 border-t border-ink/15 py-5"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-wide text-xs font-semibold text-paper">
                  {item.badge}
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-label font-bold">{item.title}</span>
                  <span className="font-technical text-micro text-graphite uppercase">{item.org}</span>
                </span>
                <span className="font-technical text-micro text-graphite">{item.year}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      ) : null}
      {recognition.quotes.length > 0 ? (
        <Parallax distance={45}>
          <Label>{recognition.quotesLabel}</Label>
          <div className="flex flex-col gap-8">
            {recognition.quotes.map((quote, index) => (
              <Reveal key={index} as="article" delay={index * 0.1} className="flex flex-col gap-3">
                <span aria-hidden className="font-wide text-5xl leading-none text-signal">
                  “
                </span>
                <blockquote className="font-glyph text-[clamp(1.15rem,1.6vw,1.45rem)] leading-snug text-pretty">
                  {quote.quote}
                </blockquote>
                <span className="font-technical text-micro text-graphite uppercase">{quote.source}</span>
              </Reveal>
            ))}
          </div>
        </Parallax>
      ) : null}
    </div>
  </Section>
);
