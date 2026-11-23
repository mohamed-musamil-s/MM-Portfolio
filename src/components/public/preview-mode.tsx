"use client";

import { createContext, use } from "react";

/**
 * True when a public screen renders inside the studio's live preview
 * (Content Forge). Screens use it to switch off side effects there:
 * no redirects, no status polling.
 */
export const PreviewModeContext = createContext(false);

export const usePreviewMode = (): boolean => use(PreviewModeContext);
