export function notFound(req, res, next) {
  res.status(404).json({ error: 'Resource not found' });
}

// Never leak raw error details to the client
export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  if (res.headersSent) return next(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
}
