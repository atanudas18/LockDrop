import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import Puppy from '../components/Puppy';
import ProgressBar from '../components/ProgressBar';
import api from '../api/axios';

const EXPIRY_CHOICES = [
  { value: '1h', label: '1 Hour' },
  { value: '12h', label: '12 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '3d', label: '3 Days' },
  { value: '7d', label: '7 Days' },
  { value: '15d', label: '15 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'custom', label: 'Custom Date & Time' },
];

// Reads a dropped folder's contents recursively, preserving its folder
// structure, since plain drag & drop only exposes a flat FileList by default.
function readEntryAsFile(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}
function readDirEntries(reader) {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}
async function traverseFileTree(entry, prefix, out) {
  if (entry.isFile) {
    const file = await readEntryAsFile(entry);
    out.push({ file, relativePath: `${prefix}${entry.name}` });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let batch;
    do {
      batch = await readDirEntries(reader);
      for (const child of batch) {
        await traverseFileTree(child, `${prefix}${entry.name}/`, out);
      }
    } while (batch.length > 0);
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [isFolder, setIsFolder] = useState(false);
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('1d');
  const [customDate, setCustomDate] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [speed, setSpeed] = useState('');
  const [remaining, setRemaining] = useState('');
  const [puppyState, setPuppyState] = useState('idle');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [result, setResult] = useState(null);
  // When a folder is dropped (drag & drop), the browser doesn't give us
  // File.webkitRelativePath like a real folder <input> does, so we track
  // each file's folder path ourselves here (index-aligned with `files`).
  const [manualRelativePaths, setManualRelativePaths] = useState(null);
  // True once the browser has finished sending bytes (100%) but the server
  // is still zipping/uploading-to-storage/saving — so the UI can say so
  // instead of looking frozen at 100%.
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const startTimeRef = useRef(null);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const effectivePuppyState = puppyState !== 'idle'
    ? puppyState
    : passwordFocused
    ? 'covering'
    : 'idle';

  const handleFilesSelected = useCallback((fileList, folder = false) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    setFiles(arr);
    setIsFolder(folder);
    setManualRelativePaths(null);
    setResult(null);
  }, []);

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    const canReadEntries = items && items.length && typeof items[0].webkitGetAsEntry === 'function';

    if (canReadEntries) {
      const entries = Array.from(items)
        .map((it) => it.webkitGetAsEntry())
        .filter(Boolean);
      const hasFolder = entries.some((entry) => entry.isDirectory);

      if (hasFolder) {
        const collected = [];
        for (const entry of entries) {
          await traverseFileTree(entry, '', collected);
        }
        if (collected.length === 0) return;
        setFiles(collected.map((c) => c.file));
        setManualRelativePaths(collected.map((c) => c.relativePath));
        setIsFolder(true);
        setResult(null);
        return;
      }
    }

    if (e.dataTransfer.files?.length) {
      setManualRelativePaths(null);
      handleFilesSelected(e.dataTransfer.files, false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setIsFolder(false);
    setManualRelativePaths(null);
    setPassword('');
    setPercent(0);
    setSpeed('');
    setRemaining('');
    setProcessing(false);
    setPuppyState('idle');
    setResult(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select a file, folder, or files to upload.');
      return;
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return;
    }
    if (expiry === 'custom' && !customDate) {
      toast.error('Please choose a custom expiry date/time.');
      return;
    }

    const formData = new FormData();
    const relativePaths = manualRelativePaths || files.map((f) => f.webkitRelativePath || f.name);
    files.forEach((f) => formData.append('files', f, f.name));
    formData.append('relativePaths', JSON.stringify(relativePaths));
    formData.append('password', password);
    formData.append('expiry', expiry);
    if (expiry === 'custom') formData.append('customDate', new Date(customDate).toISOString());
    if (isFolder) {
      formData.append('isFolder', 'true');
      const topFolder = relativePaths[0]?.split('/')[0] || 'folder';
      formData.append('folderName', topFolder);
    }

    setUploading(true);
    setProcessing(false);
    setPercent(0);
    startTimeRef.current = Date.now();

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setPercent(pct);

          if (pct >= 100) {
            // All bytes reached the server; it still needs to zip (if a
            // folder), upload to storage, and save — that has no progress
            // events, so switch the label instead of sitting at 100% mute.
            setProcessing(true);
            setSpeed('');
            setRemaining('');
            return;
          }

          const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
          const bytesPerSec = evt.loaded / Math.max(elapsedSec, 0.1);
          setSpeed(`${formatBytes(bytesPerSec)}/s`);

          const remainingBytes = evt.total - evt.loaded;
          const remainingSec = remainingBytes / Math.max(bytesPerSec, 1);
          setRemaining(remainingSec > 1 ? `${Math.ceil(remainingSec)}s` : '<1s');
        },
      });

      setPuppyState('jump');
      toast.success('Upload complete!');
      setResult(res.data.data);
      setTimeout(() => setPuppyState('idle'), 1500);
    } catch (err) {
      setPuppyState('sad');
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
      setTimeout(() => setPuppyState('idle'), 1500);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <PageTransition>
      <section className="pt-36 pb-24 px-4 sm:px-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Puppy state={effectivePuppyState} size={80} />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload &amp; Protect</h1>
          <p className="text-white/50">Drop a file, pick a password, choose when it disappears.</p>
        </div>

        {!result ? (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-brand-400 bg-brand-400/5' : 'border-white/15 hover:border-white/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-3">📤</div>
              <p className="font-medium mb-1">Drag &amp; drop files here</p>
              <p className="text-sm text-white/40 mb-1">or choose a file below</p>
              <p className="text-sm font-bold text-amber-400 mb-4">
                To upload a folder, simply drag and drop it. 
                Please upload ZIP folders only.

              </p>

              <div className="flex flex-wrap gap-3 justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-full text-sm glass hover:bg-white/10 transition-colors"
                >
                  Upload File
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files, false)}
              />
            </div>

            {files.length > 0 && (
              <div className="glass rounded-xl p-4 text-sm">
                <p className="font-medium mb-1">
                  {isFolder ? '📁 Folder selected' : `📄 ${files.length} file${files.length > 1 ? 's' : ''} selected`}
                </p>
                <p className="text-white/50">{formatBytes(totalSize)} total</p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Password</label>
              <input
                type="password"
                value={password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a unique password"
                className="input-field"
                minLength={4}
                maxLength={128}
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Expires in</label>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="input-field appearance-none cursor-pointer"
              >
                {EXPIRY_CHOICES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-slate-900">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {expiry === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-white/70">Custom expiry</label>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {uploading && (
              <div>
                <ProgressBar percent={percent} speed={speed} remaining={remaining} />
                {processing && (
                  <p className="text-sm font-bold text-amber-400 mt-2">
                    Large files or folders may take a moment. Please keep this page open.
                  </p>
                )}
              </div>
            )}

            <motion.button
              whileHover={{ scale: uploading ? 1 : 1.02 }}
              whileTap={{ scale: uploading ? 1 : 0.97 }}
              disabled={uploading}
              onClick={handleUpload}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (processing ? 'Finalizing…' : 'Uploading…') : 'Upload'}
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center space-y-4"
          >
            <div className="text-4xl">✅</div>
            <h2 className="text-2xl font-bold">Your file is locked and ready</h2>
            <p className="text-white/60">
              Share the password you set with whoever needs this file. It expires on{' '}
              <span className="text-white">{new Date(result.expiresAt).toLocaleString()}</span>.
            </p>
            <button onClick={resetForm} className="btn-secondary">
              Upload Another
            </button>
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}