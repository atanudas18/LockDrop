const express = require('express');
const bcrypt = require('bcrypt');
const Upload = require('../models/Upload');
const { isValidPassword } = require('../utils/sanitize');
const { passwordLookup, createDownloadToken } = require('../utils/security');
const { verifyLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

router.post('/', verifyLimiter, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!isValidPassword(password)) return res.status(400).json({ success:false, message:'Invalid password.' });

    const lookup = passwordLookup(password);
    let match = await Upload.findOne({ passwordLookup:lookup, expiresAt:{ $gt:new Date() } });
    if (!match) {
      const legacy = await Upload.find({ passwordLookup:{ $exists:false }, expiresAt:{ $gt:new Date() } });
      for (const doc of legacy) {
        if (await bcrypt.compare(password, doc.passwordHash)) {
          match = doc;
          match.passwordLookup = lookup;
          await match.save().catch(() => {});
          break;
        }
      }
    }
    if (!match) return res.status(404).json({ success:false, message:'No file found for that password.' });
    const { token, tokenExpiresAt } = createDownloadToken(match._id.toString(), match.expiresAt);
    res.json({ success:true, data:{ id:match._id, originalName:match.originalName, size:match.size, fileType:match.fileType, createdAt:match.createdAt, expiresAt:match.expiresAt, downloadCount:match.downloadCount, folder:match.folder, downloadToken:token, downloadTokenExpiresAt:tokenExpiresAt } });
  } catch (err) { next(err); }
});
module.exports = router;
