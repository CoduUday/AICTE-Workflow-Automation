import { authService } from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.login({ email, password, role });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
