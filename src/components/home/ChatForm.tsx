"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/shared/cn";
import { CONTACT_LIMITS, contactSubmissionSchema } from "@/lib/shared/contact/contact-schema";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { SendButton } from "./SendButton";

/*
 * The contact form told as a chat (docs/features/CONTACT_MESSAGES.md), set
 * on the page with no window or bubbles: the host's lines in large type,
 * the visitor's answers in signal capitals, the composer a big underlined
 * line. The questions arrive one at a time (each after a short "typing"
 * beat); topics are slashed text options. At the end the composer becomes the send button: the impact plays
 * while sending, the check and the full-screen celebration once the server
 * has accepted it, then a thank-you from the other side. Messages go to
 * POST /api/contact and land in the studio's chat module.
 */

type Form = HomeContent["contact"]["form"];
type Step = "name" | "email" | "topic" | "message" | "review" | "sent";
type Bubble = { id: number; from: "host" | "you"; text: string; tone?: "error" };
type Values = { name: string; email: string; topic: string; message: string };

/** The "typing" beat before each question. */
const TYPING_MS = 700;
/** Time for the check and the celebration to play before the thank-you arrives. */
const THANKS_DELAY_MS = 1200;

const EMPTY: Values = { name: "", email: "", topic: "", message: "" };

const nextStep = (step: Step, hasTopics: boolean): Step => {
  if (step === "name") return "email";
  if (step === "email") return hasTopics ? "topic" : "message";
  if (step === "topic") return "message";
  return "review";
};

const fill = (text: string, values: Values) => text.replaceAll("{name}", values.name);

const TypingDots = () => (
  <span className="flex gap-1 py-1" aria-hidden>
    {[0, 1, 2].map((dot) => (
      <motion.span
        key={dot}
        className="size-1.5 rounded-full bg-graphite"
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
      />
    ))}
  </span>
);

const BubbleView = ({ bubble }: { bubble: Bubble }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE_PRINT }}
    className={cn(
      "max-w-[92%] leading-[1.15] whitespace-pre-line",
      bubble.from === "host"
        ? "self-start font-glyph text-[clamp(1.25rem,2vw,1.75rem)] text-ink"
        : "self-end text-right font-wide text-[clamp(1rem,1.5vw,1.3rem)] font-semibold text-signal uppercase",
      bubble.tone === "error" && "text-signal",
    )}
  >
    {bubble.from === "you" ? <span aria-hidden>→ </span> : null}
    {bubble.tone === "error" ? <span aria-hidden>× </span> : null}
    {bubble.text}
  </motion.div>
);

export const ChatForm = ({ form }: { form: Form }) => {
  const hasTopics = form.topics.length > 0;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>("name");
  const [values, setValues] = useState<Values>(EMPTY);
  const [draft, setDraft] = useState("");
  const [sendState, setSendState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [website, setWebsite] = useState("");
  const openedAt = useRef(0);
  const ids = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const started = useRef(false);
  // Set once the visitor has answered: from then on the composer keeps focus from step to step.
  const engaged = useRef(false);
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, margin: "0px 0px -20% 0px" });

  const push = (bubble: Omit<Bubble, "id">) => setBubbles((list) => [...list, { ...bubble, id: ++ids.current }]);

  /** The host "types" for a beat, then says it. */
  const say = (text: string, then?: () => void) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push({ from: "host", text });
      then?.();
    }, TYPING_MS);
  };

  // The greeting and the first question, once, when the chat first comes into view.
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    say(form.prompts.greeting, () => say(form.prompts.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when first seen
  }, [inView]);

  // The field stays usable during the "typing" beat (an answer just can't be sent then), and it is
  // focused again after each step change, since the message step swaps the input for a textarea.
  useEffect(() => {
    if (engaged.current) {
      field.current?.focus({ preventScroll: true });
    }
  }, [step]);

  // Keep the newest bubble in view.
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, typing]);

  const ask = (next: Step, answered: Values) => {
    setStep(next);
    const prompt: Record<Step, string> = {
      name: form.prompts.name,
      email: form.prompts.email,
      topic: form.prompts.topic,
      message: form.prompts.message,
      review: form.prompts.review,
      sent: "",
    };
    say(fill(prompt[next], answered));
  };

  /** Checks one answer; returns the error text, or null when it is fine. */
  const check = (current: Step, value: string): string | null => {
    const shape = contactSubmissionSchema.shape;
    if (current === "name") return shape.name.safeParse(value).success ? null : form.errors.name;
    if (current === "email") return shape.email.safeParse(value).success ? null : form.errors.email;
    if (current === "message") return shape.message.safeParse(value).success ? null : form.errors.message;
    return null;
  };

  const answer = (value: string) => {
    if (typing) return;
    engaged.current = true;
    const problem = check(step, value);
    push({ from: "you", text: value || "…" });
    setDraft("");
    if (problem) {
      say(problem);
      return;
    }
    const key = step as keyof Values;
    const answered = { ...values, [key]: value.trim() };
    setValues(answered);
    ask(nextStep(step, hasTopics), answered);
  };

  const send = async () => {
    if (sendState === "sending" || sendState === "done") return;
    setSendState("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website,
          elapsedMs: openedAt.current ? Date.now() - openedAt.current : 0,
        }),
      });
      if (!response.ok) {
        setSendState("error");
        say(response.status === 429 ? form.errors.rate : form.errors.failed);
        return;
      }
      // Only now, after the server accepted it: the check and the celebration, then the thank-you.
      setSendState("done");
      window.setTimeout(() => {
        setStep("sent");
        say(`${fill(form.thanks.title, values)}\n${form.thanks.text}`);
      }, THANKS_DELAY_MS);
    } catch {
      setSendState("error");
      say(form.errors.failed);
    }
  };

  const restart = () => {
    setBubbles([]);
    setValues(EMPTY);
    setDraft("");
    setSendState("idle");
    openedAt.current = 0;
    say(form.prompts.name);
    setStep("name");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === "review") {
      void send();
      return;
    }
    if (step !== "topic" && step !== "sent") {
      answer(draft);
    }
  };

  const isText = step === "name" || step === "email" || step === "message";
  const placeholder =
    step === "name"
      ? form.name.placeholder
      : step === "email"
        ? form.email.placeholder
        : step === "message"
          ? form.message.placeholder
          : "";
  const fieldLabel = step === "name" ? form.name.label : step === "email" ? form.email.label : form.message.label;

  return (
    <div ref={frame} className="flex h-[min(36rem,74svh)] flex-col">
      {/* A line of marginalia above the conversation. */}
      <div className="flex items-center justify-between gap-4 border-t border-ink/20 pt-3 font-technical text-micro uppercase">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-signal">{form.label}</span>
          {form.replyNote ? (
            <span className="flex items-center gap-1.5 text-graphite">
              <StatusDot />
              {form.replyNote}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={restart}
          className="font-technical text-micro text-graphite uppercase underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-signal"
        >
          {form.prompts.restart}
        </button>
      </div>

      {/* The conversation. It scrolls on its own: data-lenis-prevent keeps the page's smooth scroll from taking the wheel. */}
      <div
        data-lenis-prevent
        ref={log}
        role="log"
        aria-live="polite"
        className="flex flex-1 flex-col gap-5 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_14%)] py-8"
      >
        {bubbles.map((bubble) => (
          <BubbleView key={bubble.id} bubble={bubble} />
        ))}
        <AnimatePresence>
          {typing ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="self-start py-2"
            >
              <TypingDots />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The composer: a field for each question, quick replies for the topic, the send button at the end. */}
      <form
        noValidate
        onSubmit={onSubmit}
        onFocus={() => {
          openedAt.current ||= Date.now();
        }}
        className="pt-2"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="absolute -left-[9999px] size-px opacity-0"
        />
        {isText ? (
          <div className="flex items-end gap-4">
            {step === "message" ? (
              <textarea
                ref={field}
                aria-label={fieldLabel}
                rows={2}
                maxLength={CONTACT_LIMITS.messageMax}
                placeholder={placeholder}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    answer(draft);
                  }
                }}
                className="min-h-14 flex-1 resize-none border-b-2 border-ink bg-transparent py-3 font-glyph text-[clamp(1.1rem,1.8vw,1.5rem)] placeholder:text-graphite/50 focus:border-signal focus:outline-none"
              />
            ) : (
              <input
                ref={field}
                aria-label={fieldLabel}
                type={step === "email" ? "email" : "text"}
                autoComplete={step === "email" ? "email" : "name"}
                maxLength={step === "email" ? CONTACT_LIMITS.email : CONTACT_LIMITS.name}
                placeholder={placeholder}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="h-14 flex-1 border-b-2 border-ink bg-transparent font-glyph text-[clamp(1.1rem,1.8vw,1.5rem)] placeholder:text-graphite/50 focus:border-signal focus:outline-none"
              />
            )}
            <button
              type="submit"
              aria-label={form.submit}
              disabled={typing}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform duration-300 ease-print hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-40"
            >
              ↑
            </button>
          </div>
        ) : null}

        {step === "topic" ? (
          <div
            role="group"
            aria-label={form.topicsLabel}
            className="flex flex-wrap items-baseline gap-x-1 gap-y-2 border-b-2 border-ink pb-3"
          >
            {form.topics.map((topic, index) => (
              <span key={topic} className="flex items-baseline">
                {index > 0 ? (
                  <span aria-hidden className="px-3 font-wide text-signal">
                    /
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={typing}
                  onClick={() => answer(topic)}
                  className="font-wide text-[clamp(1rem,1.6vw,1.35rem)] font-semibold uppercase underline decoration-ink/25 decoration-2 underline-offset-[0.3em] transition-colors duration-300 ease-print hover:text-signal hover:decoration-signal focus-visible:outline-2 focus-visible:outline-signal disabled:opacity-40"
                >
                  {topic}
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {step === "review" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/20 pt-4">
            <span className="font-technical text-micro text-graphite uppercase">
              {values.name} · {values.email}
            </span>
            <SendButton state={sendState}>{sendState === "sending" ? form.sending : form.submit}</SendButton>
          </div>
        ) : null}

        {step === "sent" ? (
          <div className="flex justify-end border-t border-ink/20 pt-4">
            <button
              type="button"
              onClick={restart}
              className="text-label font-bold uppercase underline underline-offset-4 hover:decoration-2"
            >
              {form.thanks.again}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
};
