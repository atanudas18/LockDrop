const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Upload = require('../models/Upload');
const { verifyDownloadToken } = require('../utils/security');
const { generalLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.get('/:id', generalLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.query.token;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success:false, message:'Invalid file reference.' });
    if (!verifyDownloadToken(id, token)) return res.status(401).json({ success:false, message:'Download authorization is invalid or expired. Unlock the file again.' });
    const doc = await Upload.findById(id);
    if (!doc) return res.status(404).json({ success:false, message:'File not found or has expired.' });
    if (doc.expiresAt <= new Date()) return res.status(410).json({ success:false, message:'This file has expired.' });

    const upstream = await axios.get(doc.cloudinaryUrl, { responseType:'stream', timeout:30000 });
    const safeName = (doc.originalName || doc.zipName || 'download').replace(/["\r\n]/g, '');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', doc.fileType || 'application/octet-stream');
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    upstream.data.on('error', next);
    upstream.data.pipe(res);
    Upload.updateOne({ _id:doc._id }, { $inc:{ downloadCount:1 } }).catch((e) => console.error('[download] count update failed:', e.message));
  } catch (err) { next(err); }
});
module.exports = router;
