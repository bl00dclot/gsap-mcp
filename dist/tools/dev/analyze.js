import { z } from "zod";
import { getLayoutTriggeringProperties } from "../../knowledge/properties.js";
// ── Core analysis logic ────────────────────────────────────
export function analyzeGsapCode(params) {
    const issues = [];
    if (params.checkPerformance) {
        runPerformanceChecks(params.code, issues);
    }
    if (params.suggestOptimizations) {
        runOptimizationChecks(params.code, issues);
    }
    if (params.checkAccessibility) {
        runAccessibilityChecks(params.code, issues);
    }
    const score = calculateScore(issues);
    const summary = buildSummary(issues, score);
    return { issues, score, summary };
}
// ── Performance checks ─────────────────────────────────────
function runPerformanceChecks(code, issues) {
    // 1. Layout-triggering properties
    const layoutProps = getLayoutTriggeringProperties();
    for (const prop of layoutProps) {
        // Match property name as a key in an object literal: `width:` or `width :`
        const pattern = new RegExp(`\\b${escapeRegex(prop.gsapName)}\\s*:`, "g");
        if (pattern.test(code)) {
            issues.push({
                severity: "warning",
                message: `Animating "${prop.gsapName}" triggers layout recalculation.`,
                suggestion: prop.performanceNote ?? "Use transforms instead.",
            });
        }
    }
    // 2. boxShadow
    if (/\bboxShadow\s*:/.test(code)) {
        issues.push({
            severity: "warning",
            message: 'Animating "boxShadow" is expensive to render.',
            suggestion: "Use a pseudo-element with opacity or CSS filter: drop-shadow() instead.",
        });
    }
    // 3. duration: 0
    if (/duration\s*:\s*0(?![.\d])/.test(code)) {
        issues.push({
            severity: "error",
            message: "duration: 0 found — this creates a zero-length tween.",
            suggestion: "Use gsap.set() instead of duration: 0 for instant property changes.",
        });
    }
    // 4. Large stagger without batch
    if (/stagger\s*:/.test(code) && !/ScrollTrigger\.batch/.test(code)) {
        // Check if selector looks generic (class selectors that could match many elements)
        const selectorMatch = code.match(/gsap\.\w+\(\s*["'](\.[a-zA-Z][\w-]*)["']/);
        if (selectorMatch) {
            issues.push({
                severity: "info",
                message: `Stagger used with selector "${selectorMatch[1]}" — may match many elements.`,
                suggestion: "Consider ScrollTrigger.batch() for large sets of staggered elements for better scroll performance.",
            });
        }
    }
}
// ── Optimization checks ────────────────────────────────────
function runOptimizationChecks(code, issues) {
    // 5. Duplicate duration/ease across multiple tweens
    const durationMatches = code.match(/duration\s*:\s*[\d.]+/g);
    if (durationMatches && durationMatches.length >= 3) {
        const values = durationMatches.map((m) => m.replace(/\s/g, ""));
        const unique = new Set(values);
        if (unique.size === 1) {
            issues.push({
                severity: "info",
                message: `Same duration value repeated ${durationMatches.length} times.`,
                suggestion: "Use timeline defaults: gsap.timeline({ defaults: { duration: ... } }) to reduce repetition.",
            });
        }
    }
    const easeMatches = code.match(/ease\s*:\s*["'][^"']+["']/g);
    if (easeMatches && easeMatches.length >= 3) {
        const values = easeMatches.map((m) => m.replace(/\s/g, ""));
        const unique = new Set(values);
        if (unique.size === 1) {
            issues.push({
                severity: "info",
                message: `Same ease value repeated ${easeMatches.length} times.`,
                suggestion: "Use timeline defaults: gsap.timeline({ defaults: { ease: ... } }) to reduce repetition.",
            });
        }
    }
    // 6. Old GSAP 2 syntax
    if (/\b(TweenMax|TweenLite|TimelineMax|TimelineLite)\b/.test(code)) {
        issues.push({
            severity: "warning",
            message: "Legacy GSAP 2 syntax detected (TweenMax/TweenLite/TimelineMax/TimelineLite).",
            suggestion: "Migrate to GSAP 3 syntax: use gsap.to(), gsap.from(), gsap.timeline() instead.",
        });
    }
    // 7. Missing registerPlugin when plugin imports detected
    const pluginImportPattern = /import\s*\{?\s*(ScrollTrigger|Flip|Draggable|MotionPathPlugin|TextPlugin|DrawSVGPlugin|MorphSVGPlugin|ScrambleTextPlugin|SplitText|Observer)\s*\}?\s*from/g;
    const importedPlugins = [];
    let match;
    while ((match = pluginImportPattern.exec(code)) !== null) {
        importedPlugins.push(match[1]);
    }
    for (const plugin of importedPlugins) {
        if (!code.includes(`registerPlugin(${plugin}`) && !code.includes(`registerPlugin( ${plugin}`)) {
            issues.push({
                severity: "error",
                message: `${plugin} is imported but gsap.registerPlugin(${plugin}) is missing.`,
                suggestion: `Add gsap.registerPlugin(${plugin}) after import.`,
            });
        }
    }
    // 8. jQuery-style selectors
    if (/\$\(\s*["']/.test(code)) {
        issues.push({
            severity: "warning",
            message: "jQuery-style selector $() detected.",
            suggestion: 'Use plain CSS selectors — GSAP accepts CSS selectors directly: gsap.to(".class", ...).',
        });
    }
    // 9. Delay for sequencing
    const delayMatches = code.match(/delay\s*:\s*[\d.]+/g);
    if (delayMatches && delayMatches.length >= 2) {
        issues.push({
            severity: "info",
            message: "Multiple delay properties found — may indicate manual sequencing.",
            suggestion: 'Use a timeline with position parameter for sequencing: tl.to(..., "+=0.5") instead of delay.',
        });
    }
    // 10. Same target animated multiple times without overwrite
    const targetPattern = /gsap\.\w+\(\s*["']([^"']+)["']/g;
    const targets = [];
    let targetMatch;
    while ((targetMatch = targetPattern.exec(code)) !== null) {
        targets.push(targetMatch[1]);
    }
    const duplicateTargets = targets.filter((t, i) => targets.indexOf(t) !== i);
    if (duplicateTargets.length > 0 && !/overwrite/.test(code)) {
        issues.push({
            severity: "info",
            message: `Target "${duplicateTargets[0]}" is animated multiple times without overwrite.`,
            suggestion: 'Add overwrite: "auto" to prevent conflicting tweens on the same target.',
        });
    }
}
// ── Accessibility checks ───────────────────────────────────
function runAccessibilityChecks(code, issues) {
    // 11. No reduced-motion handling
    if (!(/matchMedia/.test(code) && /prefers-reduced-motion/.test(code))) {
        issues.push({
            severity: "warning",
            message: "No prefers-reduced-motion handling detected.",
            suggestion: 'Use gsap.matchMedia() with "(prefers-reduced-motion: reduce)" to disable/reduce animations for users who prefer less motion.',
        });
    }
    // 12. Very fast animations
    const fastDuration = /duration\s*:\s*(0\.0\d+)\b/g;
    let fastMatch;
    while ((fastMatch = fastDuration.exec(code)) !== null) {
        const val = parseFloat(fastMatch[1]);
        if (val < 0.1) {
            issues.push({
                severity: "warning",
                message: `Very fast animation (duration: ${val}) may cause a flash.`,
                suggestion: "Consider a minimum duration of 0.15s for visual comfort.",
            });
        }
    }
}
// ── Scoring ────────────────────────────────────────────────
function calculateScore(issues) {
    let score = 100;
    for (const issue of issues) {
        switch (issue.severity) {
            case "error":
                score -= 15;
                break;
            case "warning":
                score -= 8;
                break;
            case "info":
                score -= 3;
                break;
        }
    }
    return Math.max(0, score);
}
// ── Summary ────────────────────────────────────────────────
function buildSummary(issues, score) {
    if (issues.length === 0) {
        return "No issues found. Score: 100/100";
    }
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const infos = issues.filter((i) => i.severity === "info").length;
    const parts = [];
    if (errors > 0)
        parts.push(`${errors} error${errors > 1 ? "s" : ""}`);
    if (warnings > 0)
        parts.push(`${warnings} warning${warnings > 1 ? "s" : ""}`);
    if (infos > 0)
        parts.push(`${infos} info${infos > 1 ? "s" : ""}`);
    return `Found ${issues.length} issues (${parts.join(", ")}). Score: ${score}/100`;
}
// ── Helpers ────────────────────────────────────────────────
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// ── MCP tool registration ──────────────────────────────────
export function registerAnalyzeTool(server) {
    server.registerTool("gsap_analyze", {
        title: "GSAP Code Analyzer",
        description: "Analyze GSAP animation code for performance issues, best practices, and optimization opportunities",
        inputSchema: {
            code: z.string().describe("The GSAP code to analyze"),
            checkPerformance: z.boolean().optional().default(true),
            suggestOptimizations: z.boolean().optional().default(true),
            checkAccessibility: z.boolean().optional().default(false),
        },
    }, async (args) => {
        const result = analyzeGsapCode(args);
        const lines = [result.summary, ""];
        for (const issue of result.issues) {
            const badge = issue.severity === "error"
                ? "[ERROR]"
                : issue.severity === "warning"
                    ? "[WARN]"
                    : "[INFO]";
            lines.push(`${badge} ${issue.message}`);
            lines.push(`  → ${issue.suggestion}`);
            lines.push("");
        }
        return {
            content: [{ type: "text", text: lines.join("\n").trim() }],
        };
    });
}
