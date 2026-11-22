import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single GSAP entry point. Import gsap, plugins and useGSAP from here so the
 * plugins are registered exactly once, and only in the browser.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Observer, useGSAP);
}

export { gsap, Observer, ScrollTrigger, useGSAP };
