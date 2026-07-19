import { motion } from 'framer-motion';

export default function ProgressBar({ percent = 0, speed, remaining }) {
  return (
    <div className="w-full">
      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-fuchsia-400"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ ease: 'easeOut', duration: 0.2 }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50 mt-2">
        <span>{percent}%</span>
        <span>
          {speed ? `${speed} · ` : ''}
          {remaining ? `${remaining} left` : ''}
        </span>
      </div>
    </div>
  );
}
