import { motion, AnimatePresence } from 'framer-motion';

/**
 * A lightweight, dependency-free "puppy" mascot built from CSS/emoji
 * and Framer Motion instead of a Lottie file (so the project runs
 * with zero external animation assets). Swap the inner content for
 * an actual <Lottie animationData={...} /> per state if you'd like
 * richer animation — the `state` prop is already wired for that.
 *
 * States: idle | covering | happy | sad | jump | celebrate
 */
export default function Puppy({ state = 'idle', size = 90 }) {
  const face = {
    idle: '🐶',
    covering: '🙈',
    happy: '🐶',
    sad: '🐶',
    jump: '🐶',
    celebrate: '🐶',
  }[state];

  const wrapperAnim = {
    idle: { y: [0, -6, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
    covering: { rotate: [0, -2, 2, 0], transition: { duration: 0.6, repeat: Infinity } },
    happy: { scale: [1, 1.15, 1], transition: { duration: 0.6, repeat: Infinity } },
    sad: { rotate: [-3, 3, -3], y: 4, transition: { duration: 1.2, repeat: Infinity } },
    jump: { y: [0, -30, 0], transition: { duration: 0.5, repeat: 2 } },
    celebrate: { rotate: [0, 15, -15, 15, -15, 0], scale: [1, 1.2, 1], transition: { duration: 0.8 } },
  }[state];

  return (
    <div className="flex flex-col items-center justify-center select-none mb-2">
      <motion.div
        animate={wrapperAnim}
        style={{ fontSize: size }}
        className="drop-shadow-[0_0_25px_rgba(59,102,245,0.35)]"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25 }}
            className="inline-block"
          >
            {face}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {state === 'sad' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl -mt-2"
        >
          💧
        </motion.span>
      )}
      {state === 'celebrate' && (
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl -mt-1"
        >
          🎉
        </motion.span>
      )}
    </div>
  );
}
