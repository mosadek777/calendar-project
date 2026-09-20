/**
 * The only motion in the app. Article VII (constitution 1.1.0) permits
 * framer-motion for page transitions and list-item enter/exit — nothing else.
 * Both presets live here so that boundary is visible in one place.
 */

/** Route-level: a short fade with a 4px rise. */
export const pageTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
}

/** List items: fade with a 6px rise, lightly staggered by index. */
export const listItem = (index: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.16, delay: Math.min(index, 6) * 0.008, ease: 'easeOut' as const },
})
