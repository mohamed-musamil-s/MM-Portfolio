"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { StudioShellContent } from "@/lib/shared/content/studio-shell-schema";
import { useSidebarState } from "./sidebar-state";

type NavSearchProps = {
  copy: StudioShellContent["search"];
  value: string;
  onChange: (value: string) => void;
  /** Enter opens the first match. */
  onSubmit: () => void;
};

/**
 * Menu filter at the top of the sidebar. Ctrl/⌘ + K focuses it (expanding a
 * collapsed sidebar first), Enter opens the first match, Esc clears.
 */
export const NavSearch = ({ copy, value, onChange, onSubmit }: NavSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { collapsed, toggleCollapsed } = useSidebarState();

  useEffect(() => {
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (collapsed) {
          toggleCollapsed();
        }
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [collapsed, toggleCollapsed]);

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
    if (event.key === "Escape") {
      onChange("");
    }
  };

  return (
    <label className="group/search relative flex h-9 items-center gap-2 rounded-lg border border-border bg-background/70 px-2.5 text-sm transition-colors duration-200 focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/15 hover:bg-card">
      <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">{copy.placeholder}</span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKey}
        placeholder={copy.placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label={copy.clear}
          onClick={() => onChange("")}
          className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : (
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-ui text-[0.625rem] font-medium text-muted-foreground">
          {copy.shortcut}
        </kbd>
      )}
    </label>
  );
};
