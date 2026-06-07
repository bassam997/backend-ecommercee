import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

export const protect = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const admin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return next(new ApiError(403, 'Access denied: Admin only'));
  }
  next();
};