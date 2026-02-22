# gsap-mcp

MCP server for generating GSAP animation code — no runtime dependency, pure static code generation.

## Installation

```bash
npm install
npm run build
```

## Configuration

Add to your Claude Desktop config (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gsap": {
      "command": "node",
      "args": ["/absolute/path/to/gsap-mcp/dist/index.js"]
    }
  }
}
```

## Tools (18)

### Core (4)

| Tool | Description | Example Input |
|------|-------------|---------------|
| `gsap_tween` | Generate gsap.to/from/fromTo tweens | `{ "target": ".box", "method": "to", "properties": { "opacity": 1, "x": 100 } }` |
| `gsap_timeline` | Build multi-step GSAP timelines | `{ "steps": [{ "target": ".a", "method": "to", "properties": { "x": 100 } }] }` |
| `gsap_easing` | Look up and preview GSAP easing functions | `{ "action": "lookup", "ease": "power2.out" }` |
| `gsap_preset` | Generate common animation presets (fadeIn, slideUp, etc.) | `{ "preset": "fadeIn", "target": ".hero" }` |

### Plugins (7)

| Tool | Description | Example Input |
|------|-------------|---------------|
| `gsap_scrolltrigger` | ScrollTrigger-powered scroll animations | `{ "target": ".section", "mode": "standalone", "trigger": ".section" }` |
| `gsap_splittext` | SplitText character/word/line animations | `{ "target": ".heading", "splitType": "chars", "animation": "from" }` |
| `gsap_morphsvg` | SVG shape morphing with MorphSVGPlugin | `{ "target": "#shape1", "shape": "#shape2" }` |
| `gsap_drawsvg` | SVG stroke drawing animations | `{ "target": ".path", "from": "0%", "to": "100%" }` |
| `gsap_motionpath` | Animate elements along motion paths | `{ "target": ".dot", "path": "#circuit" }` |
| `gsap_flip` | FLIP animation state transitions | `{ "targets": ".cards", "action": "full" }` |
| `gsap_textplugin` | Text replacement and scramble effects | `{ "target": ".text", "text": "Hello!", "type": "replace" }` |

### Dev (7)

| Tool | Description | Example Input |
|------|-------------|---------------|
| `gsap_analyze` | Static analysis for performance, best practices, accessibility | `{ "code": "gsap.to('.box', { width: 100 })" }` |
| `gsap_controls` | Play/pause/reverse/seek control code | `{ "action": "play", "target": "timeline" }` |
| `gsap_utilities` | GSAP utility methods (clamp, mapRange, snap, etc.) | `{ "method": "clamp", "params": { "min": 0, "max": 100, "value": 150 } }` |
| `gsap_matchmedia` | Responsive animations with gsap.matchMedia() | `{ "breakpoints": [{ "name": "Mobile", "query": "(max-width: 768px)", "animations": [] }] }` |
| `gsap_debug` | Debug utilities: markers, GSDevTools, logging, slow-motion | `{ "action": "slowmo", "options": { "timeScale": 0.25 } }` |
| `gsap_performance` | FPS monitoring, code optimization, frame profiling | `{ "action": "monitor", "options": { "metrics": ["fps"] } }` |
| `gsap_framework_integration` | Framework-specific code for React/Vue/Angular/Svelte | `{ "framework": "react", "type": "hook" }` |

## Architecture

```
gsap-mcp/
├── src/
│   ├── index.ts                  # Entry point — registers all 18 tools
│   ├── generators/
│   │   ├── code-builder.ts       # Fluent builder for imports + body assembly
│   │   └── templates.ts          # formatGsapVars, formatPosition, wrapInFunction
│   ├── knowledge/
│   │   ├── easings.ts            # Easing function database
│   │   ├── properties.ts         # CSS/GSAP property mappings + performance data
│   │   └── best-practices.ts     # Optimization rules, performance tips, pitfalls
│   └── tools/
│       ├── core/                 # Tween, timeline, easing, presets
│       ├── plugins/              # ScrollTrigger, SplitText, MorphSVG, etc.
│       └── dev/                  # Analyze, controls, utilities, debug, etc.
├── tests/                        # Mirrors src/ structure, 23 test files
├── dist/                         # Built output (tsc)
├── package.json
└── tsconfig.json
```

**Key design decisions:**

- **No GSAP runtime dependency** — the server generates code strings using static knowledge bases and template builders. It never imports or executes GSAP itself.
- **Testable core functions** — every tool exports a `generateXxxCode(params)` function that is directly testable without MCP infrastructure.
- **MCP SDK pattern** — each tool exports a `registerXxxTool(server)` function that calls `server.registerTool()` with Zod v4 input schemas.
- **CodeBuilder** — fluent builder that manages imports, plugin registration, and body lines, then assembles them with `build()` (full) or `buildSnippet()` (body only).

## Development

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest

# Type-check
npx tsc --noEmit

# Build
npx tsc

# Dev mode (tsx)
npx tsx src/index.ts
```

### Adding a new tool

1. Create `src/tools/<category>/<name>.ts`
2. Export `generateXxxCode(params): XxxResult` (testable core logic)
3. Export `registerXxxTool(server: McpServer)` (MCP registration)
4. Add import + register call in `src/index.ts`
5. Create `tests/tools/<name>.test.ts`
6. Run `npx tsc --noEmit && npx vitest run`

## License

MIT
