import { dashboardService } from '../services/dashboard.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.user);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
