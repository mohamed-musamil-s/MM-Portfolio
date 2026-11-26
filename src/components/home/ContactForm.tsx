"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/shared/cn";
import { CONTACT_LIMITS, contactSubmissionSchema } from "@/lib/shared/contact/contact-schema";
import type { HomeContent } from "@/lib/shared/content/home-schema";
import { EASE_PRINT } from "@/lib/motion/tokens";
import { SendButton } from "./SendButton";

/*
 * The contact form (docs/features/CONTACT_MESSAGES.md). Messages go to
 * POST /api/contact and land in the studio's chat module. The submit control
 * is SendButton: the impact plays when the send starts, and the check and the
 * full-screen celebration only once the server has accepted the message.
 */

type Form = HomeContent["contact"]["form"];
type Field = "name" | "email" | "message";
type Status = "idle" | "sending" | "done" | "sent" | "error";

/** Time for the button's check and the celebration to play before the thank-you replaces the form. */
const THANKS_DELAY_MS = 1400;

const Input = ({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) => (
  <div className="group relative flex flex-col gap-2">
    <label htmlFor={id} className="font-technical text-micro text-graphite uppercase">
      {label}
    </label>
    {children}
    {/* A signal line draws under the field while it has focus. */}
    <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-ink/20" />
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-signal transition-transform duration-500 ease-print group-focus-within:scale-x-100"
    />
    <AnimatePresence>
      {error ? (
        <motion.span
          id={`${id}-error`}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-6 left-0 font-technical text-micro text-ink"
        >
          × {error}
        </motion.span>
      ) : null}
    </AnimatePresence>
  </div>
);

const FIELD_CLASS =
  "w-full bg-transparent pb-3 font-glyph text-lead text-ink placeholder:text-graphite/50 focus:outline-none";

export const ContactForm = ({ form }: { form: Form }) => {
  // Set on first focus (Date.now() during render is impure); a form never touched counts as instant.
  const openedAt = useRef(0);
  const [values, setValues] = useState({ name: "", email: "", message: "", topic: form.topics[0] ?? "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const [sentName, setSentName] = useState("");

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key in errors) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const result = contactSubmissionSchema.safeParse({ ...values, elapsedMs: 0 });
    if (result.success) {
      setErrors({});
      return true;
    }
    const failed = new Set(result.error.issues.map((issue) => String(issue.path[0])));
    setErrors({
      name: failed.has("name") ? form.errors.name : undefined,
      email: failed.has("email") ? form.errors.email : undefined,
      message: failed.has("message") ? form.errors.message : undefined,
    });
    return false;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending" || status === "done" || !validate()) {
      return;
    }
    setStatus("sending");
    setProblem(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, elapsedMs: openedAt.current ? Date.now() - openedAt.current : 0 }),
      });
      if (!response.ok) {
        setStatus("error");
        setProblem(response.status === 429 ? form.errors.rate : form.errors.failed);
        return;
      }
      // Only now, after the server accepted it: the check and the celebration.
      setStatus("done");
      setSentName(values.name.trim());
      window.setTimeout(() => setStatus("sent"), THANKS_DELAY_MS);
    } catch {
      setStatus("error");
      setProblem(form.errors.failed);
    }
  };

  const again = () => {
    setValues({ name: "", email: "", message: "", topic: form.topics[0] ?? "", website: "" });
    openedAt.current = 0;
    setStatus("idle");
  };

  return (
    <div className="relative rounded-[1.75rem] border border-ink/10 bg-paper p-6 sm:p-10">
      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.8, ease: EASE_PRINT }}
            className="flex min-h-[28rem] flex-col items-start justify-center gap-5"
            role="status"
          >
            <span className="grid size-14 place-items-center rounded-full bg-signal text-2xl text-paper">✓</span>
            <h4 className="font-wide text-[clamp(1.6rem,3vw,2.6rem)] leading-tight font-semibold uppercase">
              {form.thanks.title.replace("{name}", sentName)}
            </h4>
            <p className="max-w-[40ch] font-glyph text-lead text-graphite">{form.thanks.text}</p>
            <button
              type="button"
              onClick={again}
              className="text-label font-bold uppercase underline underline-offset-4 hover:decoration-2"
            >
              {form.thanks.again}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={submit}
            onFocus={() => {
              openedAt.current ||= Date.now();
            }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: EASE_PRINT }}
            className="flex flex-col gap-9"
          >
            <div className="flex items-center justify-between font-technical text-micro uppercase">
              <span className="text-signal">{form.label}</span>
              <span className="text-graphite">{form.replyNote}</span>
            </div>

            <div className="grid gap-9 sm:grid-cols-2">
              <Input id="cf-name" label={form.name.label} error={errors.name ?? null}>
                <input
                  id="cf-name"
                  name="name"
                  autoComplete="name"
                  maxLength={CONTACT_LIMITS.name}
                  placeholder={form.name.placeholder}
                  value={values.name}
                  onChange={(event) => set("name")(event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "cf-name-error" : undefined}
                  className={FIELD_CLASS}
                />
              </Input>
              <Input id="cf-email" label={form.email.label} error={errors.email ?? null}>
                <input
                  id="cf-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={CONTACT_LIMITS.email}
                  placeholder={form.email.placeholder}
                  value={values.email}
                  onChange={(event) => set("email")(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "cf-email-error" : undefined}
                  className={FIELD_CLASS}
                />
              </Input>
            </div>

            {form.topics.length > 0 ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 font-technical text-micro text-graphite uppercase">{form.topicsLabel}</legend>
                <div className="flex flex-wrap gap-2">
                  {form.topics.map((topic) => (
                    <label
                      key={topic}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition-colors duration-300 ease-print has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-signal",
                        values.topic === topic ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink",
                      )}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={topic}
                        checked={values.topic === topic}
                        onChange={() => set("topic")(topic)}
                        className="sr-only"
                      />
                      {topic}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <Input id="cf-message" label={form.message.label} error={errors.message ?? null}>
              <textarea
                id="cf-message"
                name="message"
                rows={4}
                maxLength={CONTACT_LIMITS.messageMax}
                placeholder={form.message.placeholder}
                value={values.message}
                onChange={(event) => set("message")(event.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "cf-message-error" : undefined}
                className={cn(FIELD_CLASS, "resize-none")}
              />
            </Input>

            {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={values.website}
              onChange={(event) => set("website")(event.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
            />

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <SendButton state={status}>{status === "sending" ? form.sending : form.submit}</SendButton>
              <AnimatePresence>
                {problem ? (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-[32ch] font-technical text-micro text-ink uppercase"
                  >
                    × {problem}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
