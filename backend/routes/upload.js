const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const Upload = require('../models/Upload');
const { zipFilesToPath } = require('../utils/zipFolder');
const { sanitizeFilename, isValidPassword } = require('../utils/sanitize');
const { passwordLookup } = require('../utils/security');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;
const tempRoot = path.join(os.tmpdir(), 'lockdrop');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try { await fs.mkdir(tempRoot, { recursive: true }); cb(null, tempRoot); } catch (e) { cb(e); }
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.tmp`),
});
const upload = multer({ storage, preservePath: true, limits: { fileSize: MAX_FILE_SIZE, files: 200 } });

const EXPIRY_OPTIONS = { '1h':3600000,'12h':43200000,'1d':86400000,'3d':259200000,'7d':604800000,'15d':1296000000,'30d':2592000000 };
function computeExpiry(option, customDate) {
  if (option === 'custom') {
    const d = new Date(customDate);
    if (isNaN(d.getTime()) || d <= new Date()) { const e = new Error('Invalid custom expiry date. It must be a future date/time.'); e.status=400; throw e; }
    return d;
  }
  if (!EXPIRY_OPTIONS[option]) { const e = new Error('Invalid expiry option.'); e.status=400; throw e; }
  return new Date(Date.now() + EXPIRY_OPTIONS[option]);
}
async function safeUnlink(p) { if (p) await fs.unlink(p).catch(() => {}); }

router.post('/', uploadLimiter, upload.array('files', 200), async (req, res, next) => {
  let generatedZip = null;
  let cloudinaryPublicId = null;
  try {
    const { password, expiry, customDate } = req.body;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ success:false, message:'No files were provided.' });
    if (!isValidPassword(password)) return res.status(400).json({ success:false, message:'Password must be between 4 and 128 characters.' });
    const totalInputSize = files.reduce((n, f) => n + f.size, 0);
    if (totalInputSize > MAX_TOTAL_SIZE) return res.status(413).json({ success:false, message:'Total upload size cannot exceed 500 MB.' });

    const lookup = passwordLookup(password);
    const existing = await Upload.findOne({ passwordLookup: lookup, expiresAt: { $gt: new Date() } }).select('_id').lean();
    if (existing) return res.status(409).json({ success:false, message:'Password already exists. Please choose another password.' });

    // Compatibility with records created before passwordLookup was introduced.
    const legacy = await Upload.find({ passwordLookup: { $exists:false }, expiresAt:{ $gt:new Date() } }).select('passwordHash').lean();
    for (const doc of legacy) if (await bcrypt.compare(password, doc.passwordHash)) return res.status(409).json({ success:false, message:'Password already exists. Please choose another password.' });

    const expiresAt = computeExpiry(expiry, customDate);
    const isFolderOrMultiple = files.length > 1 || req.body.isFolder === 'true';
    const timestamp = Date.now();
    let uploadPath, zipName, fileType, originalName, size;

    if (isFolderOrMultiple) {
      let relativePaths = [];
      try {
        relativePaths = JSON.parse(req.body.relativePaths || '[]');
        if (!Array.isArray(relativePaths)) relativePaths = [];
      } catch (_) {
        relativePaths = [];
      }
      const sanitizedFiles = files.map((f, index) => {
        const submittedPath = relativePaths[index] || f.originalname;
        const parts = String(submittedPath)
          .split(/[/\\]/)
          .filter((part) => part && part !== '.' && part !== '..')
          .map(sanitizeFilename);
        return { ...f, relativePath: parts.join('/') || sanitizeFilename(f.originalname) };
      });
      generatedZip = path.join(tempRoot, `${timestamp}-${crypto.randomBytes(8).toString('hex')}.zip`);
      size = await zipFilesToPath(sanitizedFiles, generatedZip);
      uploadPath = generatedZip;
      zipName = `lockdrop_${timestamp}.zip`;
      fileType = 'application/zip';
      originalName = req.body.isFolder === 'true' ? `${sanitizeFilename(req.body.folderName || 'folder')}.zip` : `${files.length}_files.zip`;
    } else {
      uploadPath = files[0].path;
      size = files[0].size;
      originalName = sanitizeFilename(files[0].originalname);
      zipName = originalName;
      fileType = files[0].mimetype;
    }

    cloudinaryPublicId = `lockdrop/lockdrop_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
    const result = await cloudinary.uploader.upload(uploadPath, { resource_type:'raw', public_id:cloudinaryPublicId, overwrite:false });
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const doc = await Upload.create({ passwordHash, passwordLookup:lookup, originalName, zipName, cloudinaryPublicId:result.public_id, cloudinaryUrl:result.secure_url, fileType, size, expiresAt, folder:isFolderOrMultiple });
    res.status(201).json({ success:true, message:'Upload successful.', data:{ id:doc._id, expiresAt:doc.expiresAt } });
  } catch (err) {
    if (err?.code === 11000) { err.status=409; err.message='Password already exists. Please choose another password.'; }
    if (cloudinaryPublicId) await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type:'raw' }).catch(() => {});
    next(err);
  } finally {
    await Promise.all((req.files || []).map((f) => safeUnlink(f.path)));
    await safeUnlink(generatedZip);
  }
});
module.exports = router;
