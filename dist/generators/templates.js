const INDENT = "  ";
const GSAP_CDN_BASE = "https://cdn.jsdelivr.net/npm/gsap@3/dist";
const PLUGIN_CDN_PATHS = {
    ScrollTrigger: "ScrollTrigger.min.js",
    Flip: "Flip.min.js",
    Draggable: "Draggable.min.js",
    MotionPathPlugin: "MotionPathPlugin.min.js",
    TextPlugin: "TextPlugin.min.js",
    Observer: "Observer.min.js",
    ScrollToPlugin: "ScrollToPlugin.min.js",
    EaselPlugin: "EaselPlugin.min.js",
    PixiPlugin: "PixiPlugin.min.js",
};
function formatValue(value, depth) {
    if (value === null)
        return "null";
    if (value === undefined)
        return "undefined";
    if (typeof value === "string")
        return `"${value}"`;
    if (typeof value === "number" || typeof value === "boolean")
        return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0)
            return "[]";
        const items = value.map((v) => formatValue(v, depth + 1));
        // Keep short arrays inline
        const inline = `[${items.join(", ")}]`;
        if (inline.length <= 60)
            return inline;
        const pad = INDENT.repeat(depth + 1);
        const closePad = INDENT.repeat(depth);
        return `[\n${items.map((i) => `${pad}${i}`).join(",\n")}\n${closePad}]`;
    }
    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0)
            return "{}";
        const pad = INDENT.repeat(depth + 1);
        const closePad = INDENT.repeat(depth);
        const formatted = entries.map(([k, v]) => `${pad}${k}: ${formatValue(v, depth + 1)}`);
        // Keep short objects inline
        const inline = `{ ${entries.map(([k, v]) => `${k}: ${formatValue(v, depth + 1)}`).join(", ")} }`;
        if (inline.length <= 60 && entries.length <= 3)
            return inline;
        return `{\n${formatted.join(",\n")}\n${closePad}}`;
    }
    return String(value);
}
export function formatGsapVars(vars) {
    return formatValue(vars, 0);
}
export function formatPosition(position) {
    if (position === undefined || position === "")
        return "";
    return `, "${position}"`;
}
export function wrapInFunction(name, code) {
    const indented = code
        .split("\n")
        .map((line) => (line === "" ? "" : `${INDENT}${line}`))
        .join("\n");
    return `function ${name}() {\n${indented}\n}`;
}
export function generateCDNLinks(plugins = []) {
    const lines = [];
    lines.push(`<script src="${GSAP_CDN_BASE}/gsap.min.js"></script>`);
    for (const plugin of plugins) {
        const path = PLUGIN_CDN_PATHS[plugin];
        if (path) {
            lines.push(`<script src="${GSAP_CDN_BASE}/${path}"></script>`);
        }
    }
    return lines.join("\n");
}
