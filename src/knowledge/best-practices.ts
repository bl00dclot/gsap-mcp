export interface Pitfall {
  mistake: string;
  fix: string;
}

export interface OptimizationRule {
  pattern: string;
  suggestion: string;
  severity: "warning" | "error" | "info";
}

export const performanceTips: readonly string[] = [
  "Prefer transforms (x, y, scale, rotation) over layout properties (width, height, margin, padding)",
  "Use will-change sparingly — only add it right before animating and remove after",
  "Use gsap.set() for initial states instead of CSS to avoid flash of unstyled content",
  "Batch DOM reads before DOM writes to avoid layout thrashing",
  "Use gsap.ticker for synchronized per-frame updates instead of multiple requestAnimationFrame calls",
  "Prefer .to() over .fromTo() when the starting state matches current CSS",
  "Use the force3D: true hint to promote elements to GPU layers during animation",
  "Avoid animating box-shadow — use a pseudo-element with opacity instead",
  "Limit the number of simultaneous tweens to under 100 for consistent 60fps",
  "Use overwrite: 'auto' to automatically kill conflicting tweens on the same target",
  "Reuse timeline instances with .restart() instead of creating new ones",
  "Use gsap.quickTo() for frequently-updated values like mouse followers",
  "Stagger animations with stagger property instead of manual delays for cleaner code and better performance",
  "Use ScrollTrigger's fastScrollEnd and preventOverlaps to handle rapid scroll direction changes",
  "Kill tweens and timelines in cleanup functions to prevent memory leaks in SPAs",
] as const;

export const commonPitfalls: readonly Pitfall[] = [
  {
    mistake: "Animating 'left' or 'top' instead of transforms",
    fix: "Use x/y (transforms) instead — they are GPU-composited and skip layout",
  },
  {
    mistake: "Forgetting to kill tweens when components unmount in React/Svelte/Vue",
    fix: "Store tween/timeline refs and call .kill() in cleanup (useEffect return, onDestroy, onUnmounted)",
  },
  {
    mistake: "Using CSS transitions on the same properties GSAP is animating",
    fix: "Remove CSS transitions on GSAP-targeted properties — they conflict and cause jank",
  },
  {
    mistake: "Creating new timelines on every render/re-render",
    fix: "Create timelines once in onMount/useEffect and use .restart() or .invalidate().restart()",
  },
  {
    mistake: "Using transform shorthand in CSS alongside GSAP transform tweens",
    fix: "Let GSAP own all transform properties — use gsap.set() for initial transform state",
  },
  {
    mistake: "Not registering plugins before using them",
    fix: "Call gsap.registerPlugin(ScrollTrigger) at app entry, before any animations",
  },
  {
    mistake: "Animating elements that are display: none",
    fix: "Set visibility: hidden or opacity: 0 instead — display: none removes the element from layout entirely",
  },
  {
    mistake: "Setting duration: 0 expecting an instant set",
    fix: "Use gsap.set() for instant property changes — it's more explicit and avoids timing edge cases",
  },
  {
    mistake: "Using string selectors that match too many elements without realizing",
    fix: "Be specific with selectors or use refs — gsap.to('.box') animates ALL .box elements",
  },
  {
    mistake: "Nesting ScrollTrigger inside a timeline and expecting independent scroll control",
    fix: "ScrollTrigger controls the parent timeline's progress — use separate timelines for independent scroll sections",
  },
  {
    mistake: "Using fromTo() with values that match current state, causing a visual jump",
    fix: "Use from() to animate FROM a state to current, or to() to animate TO a target state",
  },
  {
    mistake: "Expecting percentage-based x/y values with x: '50%'",
    fix: "Use xPercent: 50 and yPercent: 50 — the x/y shorthands use pixels",
  },
] as const;

export const optimizationRules: readonly OptimizationRule[] = [
  {
    pattern: "left|top|right|bottom",
    suggestion: "Use x/y transforms instead of positional CSS properties for better performance",
    severity: "warning",
  },
  {
    pattern: "width|height",
    suggestion: "Consider using scaleX/scaleY instead of width/height to avoid layout recalculation",
    severity: "info",
  },
  {
    pattern: "margin|padding",
    suggestion: "Animating margin/padding triggers layout — use transforms for movement instead",
    severity: "warning",
  },
  {
    pattern: "boxShadow",
    suggestion: "box-shadow is expensive to animate — use a pseudo-element's opacity or filter: drop-shadow()",
    severity: "warning",
  },
  {
    pattern: "borderRadius",
    suggestion: "border-radius triggers paint — acceptable for small elements but costly on large ones",
    severity: "info",
  },
  {
    pattern: "duration:\\s*0\\b",
    suggestion: "Use gsap.set() instead of duration: 0 for instant property changes",
    severity: "error",
  },
  {
    pattern: "delay:\\s*-",
    suggestion: "Negative delays are ignored — use timeline positioning (e.g. '<-0.5') for overlapping animations",
    severity: "error",
  },
  {
    pattern: "\\.from\\(.*,.*,.*\\{.*from",
    suggestion: "Nested from() calls can cause flash of final state — consider using fromTo() for explicit control",
    severity: "warning",
  },
  {
    pattern: "transform:",
    suggestion: "Use GSAP shorthands (x, y, rotation, scale) instead of the CSS transform property directly",
    severity: "warning",
  },
  {
    pattern: "ease:\\s*['\"]linear['\"]",
    suggestion: "Use ease: 'none' instead of ease: 'linear' — 'none' is the GSAP convention",
    severity: "info",
  },
] as const;
