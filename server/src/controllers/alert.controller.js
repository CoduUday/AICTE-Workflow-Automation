import { alertService } from '../services/alert.service.js';

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getAlerts(req.query, req.user);
    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await alertService.acknowledgeAlert(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await alertService.markAllAsRead(req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
