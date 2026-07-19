function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  if (err.message === 'File too large') {
    return res.status(413).json({ success: false, message: 'File exceeds the maximum allowed size.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong. Please try again.' : err.message;

  res.status(status).json({ success: false, message });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

module.exports = { errorHandler, notFound };
