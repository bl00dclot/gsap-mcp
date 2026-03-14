#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTweenTool } from "./tools/core/tween.js";
import { registerTimelineTool } from "./tools/core/timeline.js";
import { registerEasingTool } from "./tools/core/easing.js";
import { registerPresetTool } from "./tools/core/presets.js";
import { registerScrollTriggerTool } from "./tools/plugins/scrolltrigger.js";
import { registerSplitTextTool } from "./tools/plugins/splittext.js";
import { registerMorphSVGTool } from "./tools/plugins/morphsvg.js";
import { registerDrawSVGTool } from "./tools/plugins/drawsvg.js";
import { registerMotionPathTool } from "./tools/plugins/motionpath.js";
import { registerFlipTool } from "./tools/plugins/flip.js";
import { registerTextPluginTool } from "./tools/plugins/textplugin.js";
import { registerAnalyzeTool } from "./tools/dev/analyze.js";
import { registerControlsTool } from "./tools/dev/controls.js";
import { registerUtilitiesTool } from "./tools/dev/utilities.js";
import { registerMatchMediaTool } from "./tools/dev/matchmedia.js";
import { registerDebugTool } from "./tools/dev/debug.js";
import { registerPerformanceTool } from "./tools/dev/performance.js";
import { registerFrameworkTool } from "./tools/dev/framework.js";

const server = new McpServer({
  name: "gsap-mcp",
  version: "1.0.0",
  instructions: `GSAP MCP — Pure Code Generation Server (GSAP v3.12+)

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
- Text content swap / typewriter effect → gsap_textplugin
- Analyze existing GSAP code → gsap_analyze
- SVG shape morphing → gsap_morphsvg
- SVG stroke drawing → gsap_drawsvg
- Animate along a path → gsap_motionpath
- Playback controls (play/pause/seek) → gsap_controls
- GSAP utility methods (clamp, wrap, snap, etc.) → gsap_utilities
- Responsive breakpoint animations → gsap_matchmedia
- Debug / inspect animations → gsap_debug
- Performance monitoring → gsap_performance`,
});

registerTweenTool(server);
registerTimelineTool(server);
registerEasingTool(server);
registerPresetTool(server);
registerScrollTriggerTool(server);
registerSplitTextTool(server);
registerMorphSVGTool(server);
registerDrawSVGTool(server);
registerMotionPathTool(server);
registerFlipTool(server);
registerTextPluginTool(server);
registerAnalyzeTool(server);
registerControlsTool(server);
registerUtilitiesTool(server);
registerMatchMediaTool(server);
registerDebugTool(server);
registerPerformanceTool(server);
registerFrameworkTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("gsap-mcp server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
