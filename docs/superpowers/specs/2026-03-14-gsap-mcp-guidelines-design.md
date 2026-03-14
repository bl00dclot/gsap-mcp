# GSAP MCP Server — Guidelines & Improvements Design

## Problem Statement

The gsap-mcp server compiles cleanly, passes all 893 tests, and generates correct GSAP code. However, AI models using the server produce suboptimal results because:

1. **Tool descriptions lack guidance** — descriptions say *what* but not *when* or *why*, so AI models pick the wrong tool or pass wrong arguments
2. **Common AI GSAP mistakes aren't prevented** — v2 syntax, missing cleanup, wrong imports, hallucinated methods
3. **Key modern patterns are missing** — `gsap.context()`, `gsap.quickTo()`, `gsap.registerEffect()`, `useGSAP` hook
4. **Bugs in existing tools** — onComplete string-quoting, ScrollTrigger duration loss, typewriter hardcoded text, misnamed parameter
5. **Parameter descriptions are sparse** — many params have no `.describe()`, formats aren't documented, similar tools aren't disambiguated

## Goals

- AI models correctly choose the right tool for any GSAP animation task
- Generated code follows GSAP v3.12+ best practices (never v2 syntax)
- The 3 most-requested modern patterns are available as tools
- All known bugs are fixed
- The server is ready for public npm publication

## Non-Goals

- MCP Resources or Prompts (follow-up work)
- Full plugin coverage (Draggable, Observer, ScrollSmoother — future tools)
- Keyframes support (future enhancement)
- Breaking changes to existing tool schemas

---

## Design

### 1. Server-Level Instructions

Add an `instructions` field to the `McpServer` constructor in `src/index.ts`. This is sent to the AI during `initialize` and shapes behavior across all tool calls.

```
GSAP MCP — Pure Code Generation Server (GSAP v3.12+)

This server generates static GSAP animation code. It has no runtime —
it outputs JavaScript/TypeScript code strings that the developer pastes
into their project.

RULES:
- NEVER generate GSAP v2 syntax (TweenMax, TimelineMax, TweenLite, CSSPlugin wrapping)
- ALWAYS use named exports for plugins: import { ScrollTrigger } from "gsap/ScrollTrigger"
- ALWAYS include gsap.registerPlugin() after plugin imports
- Duration goes in the TO vars for fromTo(), never in the FROM vars
- Use autoAlpha instead of opacity when elements should become non-interactive when hidden
- Prefer gsap.context() for any framework component code — it handles cleanup

TOOL SELECTION GUIDE:
- Simple single animation → gsap_tween
- Common pattern (fadeIn, slideUp, etc.) → gsap_preset
- Multi-step sequenced animation → gsap_timeline
- Scroll-linked animation → gsap_scrolltrigger
- Text character/word animation → gsap_splittext
- Layout state transition → gsap_flip
- Cursor follower / high-frequency update → gsap_quickto
- Cleanup wrapper for frameworks → gsap_context
- Reusable custom effect → gsap_effect
- React/Vue/Svelte/Angular integration → gsap_framework_integration
- Analyze existing GSAP code → gsap_analyze
```

**Implementation:** Add `instructions` property to the McpServer constructor options object in `src/index.ts`.

---

### 2. Tool Description Rewrites

Every tool description gets rewritten to follow this pattern:
1. **One-line summary** — what it does
2. **When to use** — situations where this is the right tool
3. **When NOT to use** — disambiguation from similar tools
4. **Key behavior** — defaults, notable features

#### 2.1 Core Tools

**gsap_tween** (current: "Generate GSAP tween animations (to, from, fromTo, set) with full property support")
```
New: "Generate a single GSAP tween (gsap.to, gsap.from, gsap.fromTo, gsap.set).
Use for one-off animations on a single target. For sequenced multi-step
animations use gsap_timeline instead. For common patterns like fadeIn or
slideUp use gsap_preset instead."
```

**gsap_timeline** (current: "Build complex GSAP animation timelines with multiple tweens, labels, and callbacks")
```
New: "Build a GSAP timeline with multiple sequenced or overlapping tweens,
labels, and position parameters. Use when you need 2+ animations coordinated
together. For a single animation use gsap_tween instead."
```

**gsap_easing** (current: "Browse and preview GSAP easing functions...")
```
New: "Look up GSAP easing functions by name or category. Returns descriptions,
parameters, and preview code. Use this to explore available easings — not to
generate animations (use gsap_tween or gsap_timeline for that)."
```

**gsap_preset** (current: "Get ready-to-use GSAP animation code for common patterns...")
```
New: "Generate ready-to-use code for common animation patterns (fadeIn, slideUp,
bounceIn, staggerReveal, parallax, etc.). Use when the animation matches a
standard pattern. For custom animations with specific properties use gsap_tween
instead."
```

#### 2.2 Plugin Tools

**gsap_scrolltrigger**
```
New: "Create scroll-triggered GSAP animations using ScrollTrigger. Supports
standalone tweens, timeline mode, and batch mode. Start/end format is
'triggerPosition viewportPosition' (e.g. 'top 80%', 'bottom center').
toggleActions format is 4 actions: 'onEnter onLeave onEnterBack onLeaveBack'."
```

**gsap_splittext**
```
New: "Split text into characters, words, or lines and animate them with
stagger effects using SplitText. Use for text reveal animations. For simple
text content replacement use gsap_textplugin instead."
```

**gsap_flip**
```
New: "Create layout transition animations using GSAP Flip. Captures element
state before a DOM change, then animates to the new layout. Use 'full' for
complete capture-change-animate flow, 'fit' to animate one element to match
another's position/size."
```

**gsap_morphsvg**
```
New: "Morph between SVG shapes using MorphSVGPlugin. Provide source and target
SVG paths. The endShape parameter accepts a CSS selector for another path
element OR raw SVG path data (d attribute string)."
```

**gsap_drawsvg**
```
New: "Animate SVG stroke drawing using DrawSVGPlugin. Progressively draws or
erases SVG path strokes. From/to accept percentage strings like '0%', '100%',
or two-value ranges like '50% 50%' for mid-point effects."
```

**gsap_motionpath**
```
New: "Animate an element along an SVG path or array of points using
MotionPathPlugin. The path parameter accepts an SVG path selector (e.g.
'#myPath') or an array of {x, y} point objects."
```

**gsap_textplugin**
```
New: "Animate text content changes using TextPlugin. Replaces text character
by character or scrambles it. Use for typewriter effects or text swaps. For
animating text appearance (position, opacity) use gsap_splittext instead."
```

#### 2.3 Dev Tools

**gsap_analyze**
```
New: "Analyze existing GSAP code for performance issues, best practice
violations, and optimization opportunities. Paste your GSAP code as the 'code'
parameter. This tool reads code — it does not generate animations."
```

**gsap_controls**
```
New: "Generate playback control code for GSAP animations (play, pause, reverse,
seek, timeScale, kill). Optionally generates an HTML control panel UI."
```

**gsap_utilities**
```
New: "Generate code using GSAP utility methods. Each method requires specific
params: interpolate needs {start, end, progress}, mapRange needs {inMin, inMax,
outMin, outMax, value}, clamp needs {min, max, value}, wrap needs {min, max,
value}, snap needs {snapTo, value}, distribute needs {base, amount, targets}."
```

**gsap_matchmedia**
```
New: "Create responsive animations using gsap.matchMedia(). Define breakpoints
with CSS media queries and per-breakpoint animations. Animations are
automatically cleaned up when breakpoints no longer match."
```

**gsap_debug**
```
New: "Generate debug utilities for GSAP animations. 'visualize' creates a
timeline visualization overlay, 'gsdevtools' adds the GSDevTools panel,
'log' adds lifecycle logging, 'slowmo' reduces timeScale for inspection."
```

**gsap_performance**
```
New: "Generate performance monitoring code for GSAP animations. 'monitor'
creates an FPS/memory overlay, 'optimize' analyzes code and suggests
GPU-friendly alternatives, 'profile' wraps animations in performance marks."
```

**gsap_framework_integration**
```
New: "Generate framework-specific GSAP integration code. For React: uses the
useGSAP hook from @gsap/react (recommended over raw useEffect). For Vue: uses
composables with gsap.context(). For Svelte: uses actions or onMount with
cleanup. For Angular: uses directives. Always includes proper cleanup."
```

---

### 3. Parameter Description Enrichment

Add `.describe()` to every parameter that currently lacks one. Key improvements:

#### gsap_tween
- `method`: `.describe("'to' animates TO the given values (most common). 'from' animates FROM the given values to current state. 'fromTo' animates between two explicit states. 'set' applies values instantly with no animation.")`
- `properties`: `.describe("GSAP animation properties. Use transform shorthands (x, y, scale, rotation) not CSS transform. Use autoAlpha instead of opacity+visibility. Values can be numbers, strings ('+=100', '50%'), or arrays for keyframes.")`
- `ease`: `.describe("Easing function name, e.g. 'power2.out', 'elastic.inOut', 'back.out(1.7)'. Use gsap_easing tool to browse available easings.")`
- `includeImports`: `.describe("Set to false when generating a snippet to insert into existing code that already has GSAP imported.")`

#### gsap_controls
- Rename `selector` to `variableName`: `.describe("JavaScript variable name of the tween or timeline to control, e.g. 'tl', 'heroAnimation'. NOT a CSS selector.")`

#### gsap_utilities
- `params`: Replace the generic description with method-specific guidance (see description rewrite above)

#### gsap_scrolltrigger
- `trigger.start`: `.describe("Format: 'triggerPosition viewportPosition'. Examples: 'top bottom' (default — trigger top hits viewport bottom), 'top 80%', 'center center'. Positions: top, center, bottom, or percentage.")`
- `trigger.end`: `.describe("Same format as start. Examples: 'bottom top' (default), 'bottom center', '+=500' (500px after start).")`
- `trigger.toggleActions`: `.describe("Four space-separated actions for: onEnter onLeave onEnterBack onLeaveBack. Values: play, pause, resume, reverse, restart, reset, complete, none. Example: 'play pause resume reset'.")`

#### gsap_flip
- `action`: Add default of `"full"` and `.describe("'full' = complete capture→change→animate flow (most common). 'state' = just capture current state. 'from' = animate from a previously captured state. 'fit' = animate element to match another element's position/size. 'getState' = return state object code.")`

---

### 4. New Tools (3 tools)

#### 4.1 gsap_context

**Purpose:** Generate `gsap.context()` wrappers for scoped animation cleanup.

**Schema:**
```typescript
{
  name: "gsap_context",
  description: "Generate a gsap.context() wrapper for scoped animation cleanup. Essential for any component-based framework (React, Vue, Svelte, Angular). All animations created inside the context are automatically killed when ctx.revert() is called. Use this when you need cleanup but gsap_framework_integration is too opinionated.",
  inputSchema: {
    scope: z.string().optional().describe("CSS selector or ref variable to scope all selector-based queries to. e.g. '.my-component', 'containerRef'"),
    animations: z.array(z.object({
      target: z.string(),
      method: z.enum(["to", "from", "fromTo", "set"]).default("to"),
      properties: z.record(z.string(), z.any()),
      fromProperties: z.record(z.string(), z.any()).optional(),
      duration: z.number().default(1),
      ease: z.string().optional(),
    })).describe("Animations to create inside the context"),
    includeCleanup: z.boolean().default(true).describe("Include ctx.revert() cleanup call"),
    includeImports: z.boolean().default(true),
  }
}
```

**Output example:**
```javascript
import gsap from "gsap";

const ctx = gsap.context(() => {
  gsap.to(".box", { x: 100, duration: 1, ease: "power2.out" });
  gsap.from(".title", { opacity: 0, y: 20, duration: 0.8 });
}, ".my-component"); // scope

// Cleanup — call when component unmounts
// ctx.revert();
```

#### 4.2 gsap_quickto

**Purpose:** Generate `gsap.quickTo()` code for high-frequency property updates (cursor followers, mousemove effects).

**Schema:**
```typescript
{
  name: "gsap_quickto",
  description: "Generate gsap.quickTo() for high-frequency property updates like cursor followers, parallax mousemove effects, or scroll-linked value changes. quickTo creates an optimized reusable function that updates a single property efficiently. Much more performant than creating new tweens on every event.",
  inputSchema: {
    target: z.string().describe("CSS selector for the element"),
    properties: z.array(z.string()).describe("Properties to create quickTo functions for, e.g. ['x', 'y'] or ['rotation']"),
    duration: z.number().default(0.6),
    ease: z.string().default("power3").describe("Easing for the quickTo interpolation"),
    event: z.enum(["mousemove", "scroll", "custom"]).default("mousemove").describe("Event type to generate listener code for. 'custom' outputs just the quickTo functions without event binding."),
    includeImports: z.boolean().default(true),
  }
}
```

**Output example (mousemove):**
```javascript
import gsap from "gsap";

const xTo = gsap.quickTo(".cursor", "x", { duration: 0.6, ease: "power3" });
const yTo = gsap.quickTo(".cursor", "y", { duration: 0.6, ease: "power3" });

window.addEventListener("mousemove", (e) => {
  xTo(e.clientX);
  yTo(e.clientY);
});
```

#### 4.3 gsap_effect

**Purpose:** Generate `gsap.registerEffect()` code for reusable custom animation effects.

**Schema:**
```typescript
{
  name: "gsap_effect",
  description: "Generate a reusable GSAP effect using gsap.registerEffect(). Registered effects can be called as gsap.effects.effectName(targets) or added to timelines with tl.effectName(targets) when extendTimeline is true. Use for project-wide animation patterns that should be consistent and reusable.",
  inputSchema: {
    name: z.string().describe("Effect name, used as gsap.effects.<name>() and optionally tl.<name>()"),
    method: z.enum(["to", "from", "fromTo"]).default("from"),
    properties: z.record(z.string(), z.any()).describe("Animation properties for the effect"),
    fromProperties: z.record(z.string(), z.any()).optional(),
    defaults: z.record(z.string(), z.any()).optional().describe("Default values that callers can override, e.g. { duration: 0.8, y: 20 }"),
    extendTimeline: z.boolean().default(true).describe("If true, the effect can be used directly on timelines: tl.effectName('.target')"),
    includeImports: z.boolean().default(true),
  }
}
```

**Output example:**
```javascript
import gsap from "gsap";

gsap.registerEffect({
  name: "fadeUp",
  effect: (targets, config) => {
    return gsap.from(targets, {
      opacity: 0,
      y: config.y,
      duration: config.duration,
      stagger: config.stagger,
    });
  },
  defaults: { duration: 0.8, y: 20, stagger: 0.1 },
  extendTimeline: true,
});

// Usage:
// gsap.effects.fadeUp(".my-elements");
// tl.fadeUp(".my-elements", { y: 40 });
```

---

### 5. Framework Integration Update

Update `src/tools/dev/framework.ts` to generate the modern `useGSAP` hook pattern for React instead of raw `useLayoutEffect` + `gsap.context()`.

**Current React output:**
```jsx
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function useAnimation() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".box", { x: 100 });
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}
```

**New React output:**
```jsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function useAnimation() {
  const container = useRef(null);
  useGSAP(() => {
    gsap.to(".box", { x: 100, duration: 1, ease: "power2.out" });
  }, { scope: container });
  return container;
}
```

Also update Svelte output to include `gsap.context()` cleanup pattern in the `onMount` return.

---

### 6. Bug Fixes

#### 6.1 onComplete callback string-quoting

**File:** `src/generators/code-builder.ts` (the `formatGsapVars` function)

**Problem:** `onComplete: "myCallback"` is generated instead of `onComplete: myCallback`. Callback properties should not be quoted.

**Fix:** Add a list of known callback property names (`onComplete`, `onStart`, `onUpdate`, `onRepeat`, `onReverseComplete`) and skip quoting for those values.

#### 6.2 ScrollTrigger standalone mode drops duration

**File:** `src/tools/plugins/scrolltrigger.ts` (~line 154-159)

**Problem:** In standalone non-fromTo mode, the vars object is reconstructed without the `duration` property from the animation params.

**Fix:** Include `duration` in the reconstructed vars object.

#### 6.3 Typewriter preset hardcodes text

**File:** `src/tools/core/presets.ts` (~line 353-359)

**Problem:** The typewriter preset always outputs `"Your text here"` regardless of input.

**Fix:** Accept a `text` option in the preset options and use it in the output. Fall back to `"Your text here"` only if no text is provided.

#### 6.4 Controls `selector` parameter misnamed

**File:** `src/tools/dev/controls.ts`

**Problem:** Parameter named `selector` but it takes a JavaScript variable name (e.g., `"tl"`), not a CSS selector.

**Fix:** Rename parameter to `variableName` in the schema and update the description. Keep backward compatibility by accepting either name internally.

---

### 7. Knowledge Base Updates

#### 7.1 Properties (`src/knowledge/properties.ts`)

Add:
- `autoAlpha` — "Combines opacity and visibility. When value hits 0, sets visibility: hidden so element is non-interactive. Preferred over opacity alone."
- Note on relative values — Add to property descriptions that values can be strings like `"+=100"`, `"-=50"`, `"*=2"` for relative animation

#### 7.2 Best Practices (`src/knowledge/best-practices.ts`)

Add:
- "Always use gsap.context() in component-based frameworks for cleanup"
- "Use useGSAP from @gsap/react instead of raw useEffect/useLayoutEffect"
- "Use gsap.quickTo() for mousemove/scroll-linked updates instead of creating new tweens per event"
- "Always call gsap.registerPlugin() after importing plugins — tree-shaking removes unregistered plugins"

---

### 8. Response-Level Guidance

Each tool's output should include a brief comment block explaining what the generated code does and any next steps. This helps the AI (and the developer) understand the output.

**Example for gsap_tween:**
```javascript
// Animates .box TO x:100 and opacity:0 over 1s with power1.out easing.
// Requires: npm install gsap
import gsap from "gsap";

gsap.to(".box", {
  duration: 1,
  x: 100,
  opacity: 0,
  ease: "power1.out"
});
```

Keep comments to 1-2 lines max. Only add them to the code output, not as separate text content.

---

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/index.ts` | Modify | Add `instructions` to McpServer, register 3 new tools |
| `src/tools/core/tween.ts` | Modify | Rewrite description, enrich param describes |
| `src/tools/core/timeline.ts` | Modify | Rewrite description, enrich param describes |
| `src/tools/core/easing.ts` | Modify | Rewrite description |
| `src/tools/core/presets.ts` | Modify | Rewrite description, fix typewriter bug |
| `src/tools/plugins/scrolltrigger.ts` | Modify | Rewrite description, enrich params, fix duration bug |
| `src/tools/plugins/splittext.ts` | Modify | Rewrite description |
| `src/tools/plugins/morphsvg.ts` | Modify | Rewrite description |
| `src/tools/plugins/drawsvg.ts` | Modify | Rewrite description |
| `src/tools/plugins/motionpath.ts` | Modify | Rewrite description |
| `src/tools/plugins/flip.ts` | Modify | Rewrite description, add default for action |
| `src/tools/plugins/textplugin.ts` | Modify | Rewrite description |
| `src/tools/dev/analyze.ts` | Modify | Rewrite description |
| `src/tools/dev/controls.ts` | Modify | Rewrite description, rename selector→variableName |
| `src/tools/dev/utilities.ts` | Modify | Rewrite description with per-method param guidance |
| `src/tools/dev/matchmedia.ts` | Modify | Rewrite description |
| `src/tools/dev/debug.ts` | Modify | Rewrite description |
| `src/tools/dev/performance.ts` | Modify | Rewrite description |
| `src/tools/dev/framework.ts` | Modify | Rewrite description, update React to useGSAP |
| `src/tools/core/context.ts` | **New** | gsap_context tool |
| `src/tools/core/quickto.ts` | **New** | gsap_quickto tool |
| `src/tools/core/effect.ts` | **New** | gsap_effect tool |
| `src/generators/code-builder.ts` | Modify | Fix callback string-quoting bug |
| `src/knowledge/properties.ts` | Modify | Add autoAlpha, relative values |
| `src/knowledge/best-practices.ts` | Modify | Add modern patterns |
| `tests/tools/context.test.ts` | **New** | Tests for gsap_context |
| `tests/tools/quickto.test.ts` | **New** | Tests for gsap_quickto |
| `tests/tools/effect.test.ts` | **New** | Tests for gsap_effect |
| Existing test files | Modify | Update for description/param changes, add bug regression tests |

**Total: 21 modified files, 6 new files**
