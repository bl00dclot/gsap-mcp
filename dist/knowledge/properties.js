export const TRANSFORM_PROPERTIES = [
    {
        name: "translateX",
        gsapName: "x",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "translateY",
        gsapName: "y",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "translateZ",
        gsapName: "z",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — forces 3D context, promotes to own layer",
    },
    {
        name: "rotate",
        gsapName: "rotation",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "rotateX",
        gsapName: "rotationX",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — forces 3D context",
    },
    {
        name: "rotateY",
        gsapName: "rotationY",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — forces 3D context",
    },
    {
        name: "scale",
        gsapName: "scale",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "scaleX",
        gsapName: "scaleX",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "scaleY",
        gsapName: "scaleY",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "skewX",
        gsapName: "skewX",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "skewY",
        gsapName: "skewY",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "translateX (%)",
        gsapName: "xPercent",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — percentage-based, great for responsive centering",
    },
    {
        name: "translateY (%)",
        gsapName: "yPercent",
        type: "transform",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — percentage-based, great for responsive centering",
    },
];
export const CSS_PROPERTIES = [
    {
        name: "opacity",
        gsapName: "opacity",
        type: "css",
        gpuAccelerated: true,
        performanceNote: "GPU-composited — no layout or paint triggered",
    },
    {
        name: "background-color",
        gsapName: "backgroundColor",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers paint but not layout",
    },
    {
        name: "color",
        gsapName: "color",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers paint but not layout",
    },
    {
        name: "border-radius",
        gsapName: "borderRadius",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers paint — avoid animating on large elements",
    },
    {
        name: "width",
        gsapName: "width",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — prefer scaleX for width animations",
    },
    {
        name: "height",
        gsapName: "height",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — prefer scaleY for height animations",
    },
    {
        name: "padding",
        gsapName: "padding",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — avoid animating when possible",
    },
    {
        name: "margin",
        gsapName: "margin",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — avoid animating when possible",
    },
    {
        name: "font-size",
        gsapName: "fontSize",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — prefer scale transforms for size effects",
    },
    {
        name: "letter-spacing",
        gsapName: "letterSpacing",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — use sparingly on long text",
    },
    {
        name: "line-height",
        gsapName: "lineHeight",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers layout — avoid animating in most cases",
    },
    {
        name: "box-shadow",
        gsapName: "boxShadow",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers paint — expensive on large elements, consider drop-shadow filter",
    },
    {
        name: "clip-path",
        gsapName: "clipPath",
        type: "css",
        gpuAccelerated: false,
        performanceNote: "Triggers paint — GPU-composited in some browsers with will-change",
    },
];
export const SVG_PROPERTIES = [
    {
        name: "SVG attributes",
        gsapName: "attr.*",
        type: "svg",
        gpuAccelerated: false,
        performanceNote: "Animates any SVG attribute via attr object — e.g. attr: { cx: 100 }",
    },
    {
        name: "drawSVG",
        gsapName: "drawSVG",
        type: "svg",
        gpuAccelerated: false,
        performanceNote: "Requires DrawSVGPlugin — animates stroke-dashoffset/dasharray",
    },
    {
        name: "morphSVG",
        gsapName: "morphSVG",
        type: "svg",
        gpuAccelerated: false,
        performanceNote: "Requires MorphSVGPlugin — morphs between SVG path shapes",
    },
];
export const ALL_PROPERTIES = [
    ...TRANSFORM_PROPERTIES,
    ...CSS_PROPERTIES,
    ...SVG_PROPERTIES,
];
export function getPropertiesByType(type) {
    return ALL_PROPERTIES.filter((p) => p.type === type);
}
export function getGpuAcceleratedProperties() {
    return ALL_PROPERTIES.filter((p) => p.gpuAccelerated);
}
export function getLayoutTriggeringProperties() {
    return ALL_PROPERTIES.filter((p) => !p.gpuAccelerated && p.performanceNote?.includes("layout"));
}
export function findProperty(gsapName) {
    return ALL_PROPERTIES.find((p) => p.gsapName === gsapName);
}
