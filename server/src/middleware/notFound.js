/**
 * Middleware to handle routes that are not found (404)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      statusCode: 404,
      path: req.originalUrl,
      method: req.method,
    },
  });
};
