/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);
  const isDatabaseError = err.code?.startsWith('08') || ['ECONNREFUSED', '57P01'].includes(err.code);
  const status = err.status || (isDatabaseError ? 503 : 500);
  const message = isDatabaseError
    ? 'Database unavailable. Check PostgreSQL/PostGIS and try again.'
    : err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || (isDatabaseError ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR')
    }
  });
};
