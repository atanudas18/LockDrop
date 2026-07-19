const path = require('path');

function sanitizeFilename(name) {
  if (!name) return 'file';
  let base = path.basename(name);
  base = base.replace(/[\x00-\x1f\x7f]/g, '');
  base = base.replace(/[^a-zA-Z0-9 ._()\-\[\]]/g, '_');
  base = base.trim();
  if (!base || base === '.' || base === '..') base = 'file';
  if (base.length > 200) {
    const ext = path.extname(base);
    base = base.slice(0, 200 - ext.length) + ext;
  }
  return base;
}

function isValidPassword(pw) {
  return typeof pw === 'string' && pw.length >= 4 && pw.length <= 128;
}

module.exports = { sanitizeFilename, isValidPassword };
