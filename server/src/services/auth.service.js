import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

export const authService = {
  /**
   * Authenticate user with email and password
   */
  async login({ email, password, role }) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }
    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const query = { email: email.toLowerCase().trim() };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query).select('+password');
    if (!user) {
      throw new AppError('Invalid email or credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or credentials', 401);
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        institutionId: user.institutionId,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '1d' }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        avatar: user.avatar,
      },
    };
  },

  /**
   * Retrieve current user profile
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  },
};

export default authService;
