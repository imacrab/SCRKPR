// Shared animation tokens — single source of truth for all motion in the app.
// Use these instead of inline duration/spring values.

// Easing
export const EASE_STANDARD = [0.4, 0, 0.2, 1];

// Durations (seconds)
export const DUR_FAST = 0.15;   // backdrops, micro-interactions
export const DUR_MEDIUM = 0.25; // panels, list items
export const DUR_PAGE = 0.4;    // page transitions

// Springs
export const SPRING_SHEET = { type: "spring", stiffness: 400, damping: 35 };            // bottom sheets / modals
export const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 25 };           // in-layout UI (chevrons, columns)
export const SPRING_POP = { type: "spring", stiffness: 800, damping: 8, mass: 0.5 };    // score pop / bouncy emphasis
export const SPRING_POP_SNAPPY = { type: "spring", stiffness: 650, damping: 16, mass: 0.5 }; // quick confirming pop (little overshoot, settles fast)

// Common transition presets
export const TRANSITION_FADE = { duration: DUR_FAST };
export const TRANSITION_SLIDE_OUT = { duration: 0.2, ease: [0.4, 0, 1, 1] }; // quick accelerate-away for the exiting slide element
export const TRANSITION_PANEL = { duration: DUR_MEDIUM, ease: EASE_STANDARD };
export const TRANSITION_PAGE = { duration: DUR_PAGE, ease: EASE_STANDARD };
