/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
