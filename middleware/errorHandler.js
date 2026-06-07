export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`❌ Error [${status}]:`, message);

  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}