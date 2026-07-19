const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    passwordHash: { type: String, required: true },
    passwordLookup: { type: String, unique: true, sparse: true, index: true },
    originalName: { type: String, required: true },
    zipName: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    fileType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, required: true },
    downloadCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    folder: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Expired records are removed only after their Cloudinary asset is deleted.
uploadSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Upload', uploadSchema);
