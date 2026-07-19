import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import Puppy from '../components/Puppy';

const features = [
  {
    icon: '🛡️',
    title: 'Password Protected',
    desc: 'Every upload is locked with a unique password. Never stored in plain text — bcrypt hashed.',
  },
  {
    icon: '⏱️',
    title: 'Auto-Expiring',
    desc: 'Choose from 1 hour to 30 days, or a custom date. Files self-destruct automatically.',
  },
  {
    icon: '📁',
    title: 'Folders & Multi-File',
    desc: 'Upload single files, multiple files, or entire folders — zipped automatically.',
  },
  {
    icon: '🚫',
    title: 'Zero Accounts',
    desc: 'No sign up, no login, no tracking. Just upload, share the password, done.',
  },
];

const faqs = [
  {
    q: 'Do I need to create an account?',
    a: 'No. LockDrop is fully anonymous — just upload a file and share the password with whoever needs it.',
  },
  {
    q: 'What happens when a file expires?',
    a: 'It is automatically and permanently deleted from storage and the database. No manual action needed.',
  },
  {
    q: 'Can I upload an entire folder?',
    a: 'Yes. Folder uploads are automatically zipped before being uploaded, preserving the folder structure.',
  },
  {
    q: 'Is my password stored safely?',
    a: 'Passwords are never stored in plain text. They are hashed with bcrypt before anything touches the database.',
  },
];

export default function Home() {
  return (
    <PageTransition>
      <section className="relative pt-40 pb-24 px-4 sm:px-8 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Puppy state="idle" size={90} />

          <span className="inline-block mb-5 px-4 py-1.5 rounded-full glass text-xs font-semibold tracking-wide text-brand-200 uppercase">
            Secure File Sharing Without Accounts
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-6">
            Share files with
            <br />
            <span className="gradient-text">zero friction.</span>
          </h1>

          <p className="max-w-xl mx-auto text-white/60 text-lg mb-10">
            Upload a file, folder, or a whole batch. Set a password and an expiry.
            Share the password. That's it — no sign up required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="btn-primary">
                ⬆️ Upload Files
              </motion.button>
            </Link>
            <Link to="/download">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="btn-secondary">
                ⬇️ Download File
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-4 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
            Built for <span className="gradient-text">simplicity</span>
          </h2>
          <p className="text-white/50 text-center mb-14 max-w-lg mx-auto">
            Everything you need to share files securely, nothing you don't.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass-card p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4 text-2xl">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <FaqItem key={i} {...item} />
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div layout className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-medium">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-white/50">
          ▾
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-white/50 text-sm leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
}
