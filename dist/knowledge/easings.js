function standardEasings(base, description, cssIn, cssOut, cssInOut) {
    return [
        {
            name: `${base}.in`,
            category: "standard",
            description: `${description} — accelerates from rest`,
            ...(cssIn && { cssEquivalent: cssIn }),
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.in" })`,
        },
        {
            name: `${base}.out`,
            category: "standard",
            description: `${description} — decelerates to rest`,
            ...(cssOut && { cssEquivalent: cssOut }),
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.out" })`,
        },
        {
            name: `${base}.inOut`,
            category: "standard",
            description: `${description} — accelerates then decelerates`,
            ...(cssInOut && { cssEquivalent: cssInOut }),
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.inOut" })`,
        },
    ];
}
function specialEasings(base, description) {
    return [
        {
            name: `${base}.in`,
            category: "special",
            description: `${description} — in direction`,
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.in" })`,
        },
        {
            name: `${base}.out`,
            category: "special",
            description: `${description} — out direction`,
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.out" })`,
        },
        {
            name: `${base}.inOut`,
            category: "special",
            description: `${description} — in and out`,
            previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "${base}.inOut" })`,
        },
    ];
}
export const EASING_CATALOG = [
    // none
    {
        name: "none",
        category: "standard",
        description: "Linear motion with no acceleration or deceleration",
        cssEquivalent: "linear",
        previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "none" })`,
    },
    // Standard power easings
    ...standardEasings("power1", "Subtle easing, similar to CSS defaults", "ease-in", "ease-out", "ease-in-out"),
    ...standardEasings("power2", "Moderate easing, smooth and natural"),
    ...standardEasings("power3", "Strong easing with noticeable curve"),
    ...standardEasings("power4", "Very strong easing, dramatic acceleration"),
    // Special easings
    ...specialEasings("back", "Overshoots the target then settles back"),
    ...specialEasings("elastic", "Spring-like oscillation around the target"),
    ...specialEasings("bounce", "Bounces at the endpoint like a ball dropping"),
    ...specialEasings("circ", "Circular motion curve, sharp at extremes"),
    ...specialEasings("expo", "Exponential curve, very sharp acceleration"),
    ...specialEasings("sine", "Gentle sinusoidal curve, softest of the standard easings"),
    // Custom / parametric
    {
        name: "steps(n)",
        category: "custom",
        description: "Jumps between n discrete steps with no interpolation — useful for sprite sheets",
        previewCode: `gsap.to(".sprite", { x: 500, duration: 1, ease: "steps(12)" })`,
    },
    {
        name: "rough()",
        category: "custom",
        description: "Randomized rough motion — creates a jittery, hand-drawn feel",
        previewCode: `gsap.to(".box", { x: 100, duration: 1, ease: "rough({ strength: 1, points: 20, clamp: true })" })`,
    },
    {
        name: "slow()",
        category: "custom",
        description: "Slow-motion middle section with customizable easing at start and end",
        previewCode: `gsap.to(".box", { x: 100, duration: 2, ease: "slow(0.7, 0.7, false)" })`,
    },
    {
        name: "expoScale()",
        category: "custom",
        description: "Exponential scale for value-dependent easing — useful for zoom animations",
        previewCode: `gsap.to(".box", { scale: 4, duration: 1, ease: "expoScale(1, 4)" })`,
    },
];
export const EASING_CATEGORIES = ["standard", "special", "custom"];
export function getEasingsByCategory(category) {
    return EASING_CATALOG.filter((e) => e.category === category);
}
export function findEasing(name) {
    return EASING_CATALOG.find((e) => e.name === name);
}
