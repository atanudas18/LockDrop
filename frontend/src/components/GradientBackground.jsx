import { motion } from 'framer-motion';

/**
 * Soft floating gradient blobs used as an ambient background layer.
 * Fixed + pointer-events-none so it never interferes with content.
 */
export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-slate-950" />
      <motion.div
        className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-brand-500/25 blur-3xl animate-float"
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl animate-floatSlow"
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-cyan-400/15 blur-3xl animate-float"
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
