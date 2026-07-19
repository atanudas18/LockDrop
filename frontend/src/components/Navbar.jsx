import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4"
    >
      <nav className="max-w-6xl mx-auto glass rounded-2xl px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-fuchsia-500 flex items-center justify-center text-sm">
            🔒
          </span>
          LockDrop
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              pathname === '/upload' ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            Upload
          </Link>
          <Link
            to="/download"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              pathname === '/download' ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            Download
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
