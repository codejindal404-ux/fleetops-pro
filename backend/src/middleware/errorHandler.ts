import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Log full stack trace server-side only for internal debugging
  console.error('Unhandled API Error:', err);

  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  
  // Return clean JSON without stack traces or raw filesystem internal error leaks
  res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected server error occurred. Please try again.' : (err.message || 'Request failed')
  });
};
