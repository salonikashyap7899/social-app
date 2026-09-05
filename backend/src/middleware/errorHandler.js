/** 404 for anything that did not match a route. */
export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

/** Turns thrown/forwarded errors into a consistent JSON shape. */
export function errorHandler(err, _req, res, _next) {
  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  // Duplicate key on a unique index (email / username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
}
