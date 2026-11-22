"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/studio/ui/alert";

type FormAlertProps = { title: string; message: string | null };

/** Destructive alert that expands in and collapses out, so the form never jumps. */
export const FormAlert = ({ title, message }: FormAlertProps) => (
  <AnimatePresence initial={false}>
    {message ? (
      <motion.div
        key="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.18 }}
        className="overflow-hidden"
      >
        <Alert variant="destructive" aria-live="assertive">
          <CircleAlert aria-hidden />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </motion.div>
    ) : null}
  </AnimatePresence>
);
