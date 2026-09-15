/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Catch database connection failures (e.g. Postgres down)
  if (err.message.includes('ECONNREFUSED') || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Database Error',
      detail: 'Could not connect to PostgreSQL. Is the database running?',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
