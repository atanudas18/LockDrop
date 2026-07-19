const cron = require('node-cron');
const cloudinary = require('../config/cloudinary');
const Upload = require('../models/Upload');

async function sweepExpiredUploads() {
  const expired = await Upload.find({ expiresAt:{ $lte:new Date() } }).lean();
  if (!expired.length) return;
  console.log(`[cleanup] Found ${expired.length} expired upload(s). Removing...`);
  for (const doc of expired) {
    try {
      const result = await cloudinary.uploader.destroy(doc.cloudinaryPublicId, { resource_type:'raw' });
      if (!['ok','not found'].includes(result?.result)) throw new Error(`Unexpected Cloudinary result: ${result?.result || 'unknown'}`);
      await Upload.deleteOne({ _id:doc._id });
    } catch (err) {
      console.error(`[cleanup] Keeping Mongo record for retry (${doc._id}):`, err.message);
    }
  }
  console.log('[cleanup] Sweep complete.');
}
function startCleanupJob() {
  sweepExpiredUploads().catch((e) => console.error('[cleanup] Initial sweep error:', e.message));
  cron.schedule('*/5 * * * *', () => sweepExpiredUploads().catch((e) => console.error('[cleanup] Sweep error:', e.message)));
  console.log('[cleanup] Scheduled expiry sweep every 5 minutes.');
}
module.exports = { startCleanupJob, sweepExpiredUploads };
