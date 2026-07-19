import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import Puppy from '../components/Puppy';
import api from '../api/axios';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function DownloadPage() {
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [puppyState, setPuppyState] = useState('idle');
  const [downloading, setDownloading] = useState(false);

  const effectivePuppyState = downloading
    ? 'celebrate'
    : puppyState !== 'idle'
    ? puppyState
    : focused
    ? 'covering'
    : 'idle';

  const handleVerify = async () => {
    if (!password) {
      toast.error('Please enter a password.');
      return;
    }
    setLoading(true);
    setMeta(null);
    try {
      const res = await api.post('/verify', { password });
      setMeta(res.data.data);
      setPuppyState('happy');
      toast.success('File found!');
      setTimeout(() => setPuppyState('idle'), 1500);
    } catch (err) {
      setPuppyState('sad');
      const msg = err.response?.data?.message || 'No file found for that password.';
      toast.error(msg);
      setTimeout(() => setPuppyState('idle'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!meta) return;
    setDownloading(true);
    try {
      let token = meta.downloadToken;
      let res;
      try {
        res = await api.get(`/download/${meta.id}`, { params: { token }, responseType: 'blob' });
      } catch (err) {
        // The download token is short-lived (separate from the file's own
        // expiry). If it expired while the user was reading the file info,
        // silently refresh it instead of showing a scary "expired" error.
        if (err.response?.status === 401 && password) {
          const verifyRes = await api.post('/verify', { password });
          const fresh = verifyRes.data.data;
          setMeta(fresh);
          token = fresh.downloadToken;
          res = await api.get(`/download/${meta.id}`, { params: { token }, responseType: 'blob' });
        } else {
          throw err;
        }
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', meta.originalName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
      setMeta((m) => ({ ...m, downloadCount: (m.downloadCount || 0) + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed. The file may have expired.');
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  return (
    <PageTransition>
      <section className="pt-36 pb-24 px-4 sm:px-8 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Puppy state={effectivePuppyState} size={80} />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Enter Password</h1>
          <p className="text-white/50">Type the password you were given to unlock the file.</p>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-field text-center text-lg tracking-wide"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            disabled={loading}
            onClick={handleVerify}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching…' : 'Unlock'}
          </motion.button>

          {meta && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 space-y-3 text-sm"
            >
              <Row label="File Name" value={meta.originalName} />
              <Row label="Size" value={formatBytes(meta.size)} />
              <Row label="File Type" value={meta.fileType} />
              <Row label="Uploaded" value={new Date(meta.createdAt).toLocaleString()} />
              <Row label="Expires" value={new Date(meta.expiresAt).toLocaleString()} />
              <Row label="Downloads so far" value={meta.downloadCount} />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary w-full mt-2 disabled:opacity-50"
              >
                {downloading ? 'Preparing…' : '⬇️ Download'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}