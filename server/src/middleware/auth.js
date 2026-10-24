import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
import { ROLES } from '../config/workflow.js';

/**
 * Middleware to verify JWT authentication token
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token.', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new AppError('User belonging to this token no longer exists or is deactivated.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role (RBAC)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Middleware ensuring institution users can only access their own institution records
 */
export const enforceInstitutionAccess = (req, res, next) => {
  if (req.user && req.user.role === ROLES.INSTITUTION) {
    const targetInstitutionId = req.params.institutionId || req.query.institutionId || req.body.institutionId;
    if (targetInstitutionId && targetInstitutionId !== req.user.institutionId) {
      return next(
        new AppError('Forbidden: You can only view or manage applications for your own institution.', 403)
      );
    }
  }
  next();
};
