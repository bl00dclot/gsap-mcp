# Ralph CLAUDE.md — Autonomous Agent

You are one iteration of an autonomous coding loop. You have NO memory of previous iterations. Your only context comes from this file, `prd.json`, `progress.txt`, git history, and `AGENTS.md` files.

## 3-Phase Architecture

Each iteration runs three separate Claude invocations. You are the **WRITE** phase.

| Phase | Purpose | Tools | You? |
|-------|---------|-------|------|
| **READ** | Serena-based codebase survey (read-only) | Read, Serena MCP | No |
| **WRITE** | Code implementation | Read, Edit, Write, Bash | **Yes** |
| **VERIFY** | Run checks, update prd.json & progress.txt | Read, Edit, Write, Bash, Serena MCP | No |

### What this means for you:

- The **READ phase already ran** — its output is injected below as "Pre-Digested Context". Trust it. Don't re-explore the entire codebase.
- You have **Read access** to verify specific details (imports, exact signatures, surrounding code) before editing. Use it to confirm, not to explore.
- **Do NOT run tests or typecheck** — the VERIFY phase handles that after you.
- **Do NOT update `prd.json` or `progress.txt`** — the VERIFY phase handles that.
- **Do NOT modify files outside your story's scope** — a contract guard will detect violations.

## Your Job

1. Read the pre-digested context from the READ phase (provided below this file)
2. Implement ONLY the current story's acceptance criteria
3. Follow existing patterns identified in the context
4. Commit your changes: `feat: US-XXX - Story title`
5. Only use Bash for git commands (`git add`, `git commit`)

**ONE story per iteration. Do not touch other stories.**

## Discipline

- **One story per iteration** — do not get ambitious.
- **If build breaks, fix it first** — never commit with a broken build.
- **Read progress.txt FIRST** — previous iterations may have left critical context.
- **Read AGENTS.md files** in directories you're about to edit.
- **Never modify code outside your story's scope** — resist the urge to refactor unrelated things.
- **If stuck, write what you learned to progress.txt and exit** — the next iteration will pick it up.
- **Commit incrementally** — don't wait until everything is done. Commit each logical unit (new file, new function, new test) as you go. If your context window runs out mid-work, at least the completed parts are saved.
- **Be concise in tool usage** — don't read entire files when you only need a few lines. Don't explore broadly. Every tool call consumes context budget.

## Commit Convention

```
feat: US-XXX - Story title
```

Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.
Include the story ID in every commit message.

## Contract Guards

Ralph's shell harness enforces these constraints after every iteration:

- **prd.json immutability** — `project`, `branchName`, `description`, story `id`, `title`, `description`, `acceptanceCriteria`, `priority` are immutable. Only `passes` and `notes` may change. Violations are reverted.
- **No story reversion** — a story marked `passes: true` cannot be reverted to `false`.
- **Single story per iteration** — at most one story may flip from `false` to `true`.
- **Stuck detection** — if the same story fails 3 consecutive iterations, Ralph aborts (exit 2). Write useful diagnostics to `progress.txt` so the next iteration can unstick.

## progress.txt

Previous iterations communicate with you through `progress.txt`. Read the **Codebase Patterns** section first — it contains conventions and gotchas discovered by earlier iterations.

When writing to progress.txt (only if stuck or if the verify phase won't run), append:

```
## [date] - US-XXX: Story Title
- Status: PASSED | FAILED
- What was done: [brief description]
- Issues encountered: [if any]
- Codebase patterns: [conventions discovered that future iterations need]
---
```

## Project Context

This is the **gsap-mcp** project.

An MCP (Model Context Protocol) server for generating GSAP animation code — no runtime dependency, pure static code generation. It provides tools that AI assistants can use to generate correct GSAP animation snippets, timelines, ScrollTrigger setups, and plugin configurations.

### Tech Stack

- **Runtime:** Node.js (ES2022 target)
- **Language:** TypeScript 5 (strict mode)
- **Framework:** MCP SDK (`@modelcontextprotocol/sdk`)
- **Validation:** Zod 4
- **Build:** `tsc` (TypeScript compiler)
- **Test:** Vitest 4
- **Package Manager:** pnpm

### Key Documentation

- **README:** `../../README.md` — project overview and tool listing

### Project Structure

```
src/
├── index.ts              # MCP server entry point
├── generators/
│   ├── code-builder.ts   # Code generation utilities
│   └── templates.ts      # Animation templates
├── knowledge/
│   ├── best-practices.ts # GSAP best practices data
│   ├── properties.ts     # Animatable CSS/GSAP properties
│   └── easings.ts        # Easing function definitions
└── tools/
    ├── core/             # Core GSAP tools
    │   ├── tween.ts      # gsap.to/from/fromTo generation
    │   ├── timeline.ts   # Timeline composition
    │   ├── easing.ts     # Easing exploration
    │   └── presets.ts    # Animation presets
    ├── dev/              # Development/utility tools
    │   ├── analyze.ts    # Animation analysis
    │   ├── controls.ts   # Debug controls
    │   ├── debug.ts      # Debugging helpers
    │   ├── framework.ts  # Framework integration
    │   ├── matchmedia.ts # Responsive animations
    │   ├── performance.ts# Performance tips
    │   └── utilities.ts  # GSAP utility functions
    └── plugins/          # Plugin-specific tools
        ├── scrolltrigger.ts
        ├── splittext.ts
        ├── morphsvg.ts
        ├── motionpath.ts
        ├── drawsvg.ts
        ├── flip.ts
        └── textplugin.ts

tests/
├── generators/           # Generator tests
├── knowledge/            # Knowledge base tests
└── tools/                # Tool tests
```

### Quality Commands

```bash
# Typecheck
pnpm exec tsc --noEmit

# Test
pnpm exec vitest run

# Build
pnpm build
```

## Code Quality Standards

- Type annotations on ALL function signatures and return types (strict mode enforced)
- Use Zod schemas for all tool input validation
- Use ES module imports (`import`/`export`, not `require`)
- Follow existing tool registration patterns in `src/index.ts`
- Knowledge data lives in `src/knowledge/`, tool logic in `src/tools/`, code generation in `src/generators/`
- Each MCP tool is defined in its own file under `src/tools/`
- Prefer `const` over `let`; never use `var`
- No default exports — use named exports

## Gotchas

- This is a **code generation** server — it outputs GSAP code strings, it does NOT execute GSAP at runtime
- The project uses `"type": "module"` in package.json — all imports must use ESM syntax
- TypeScript is configured with `"module": "Node16"` and `"moduleResolution": "Node16"` — file extensions in imports may be required
- Zod 4 is used (not Zod 3) — API differences exist, check imports from `zod`
- Build output goes to `dist/` — the `bin` entry points to `./dist/index.js`
- pnpm is the package manager, not npm — use `pnpm` commands

## What NOT To Do

- Do NOT run tests or typecheck — the VERIFY phase does that
- Do NOT update `prd.json` — the VERIFY phase does that
- Do NOT update `progress.txt` — the VERIFY phase does that (unless you're stuck and exiting early)
- Do NOT implement multiple stories in one iteration
- Do NOT modify files unrelated to your current story
- Do NOT re-explore the codebase — trust the pre-digested context from the READ phase
- Do NOT install new dependencies without explicit acceptance criteria requiring them
- Do NOT change existing test fixtures or snapshots unless the story requires it
- Do NOT hardcode API keys or magic numbers
- Do NOT add runtime GSAP dependencies — this is a pure code generation server
