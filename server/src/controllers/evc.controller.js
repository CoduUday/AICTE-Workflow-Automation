import { evcService } from '../services/evc.service.js';

export const getVisits = async (req, res, next) => {
  try {
    const visits = await evcService.getVisits(req.query, req.user);
    res.status(200).json({
      success: true,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleVisit = async (req, res, next) => {
  try {
    const visit = await evcService.scheduleVisit(req.body, req.user);
    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleVisit = async (req, res, next) => {
  try {
    const { newVisitDate, reason } = req.body;
    const visit = await evcService.rescheduleVisit(req.params.id, { newVisitDate, reason }, req.user);
    res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

export const submitReport = async (req, res, next) => {
  try {
    const { outcome, inspectionNotes } = req.body;
    const visit = await evcService.submitReport(req.params.id, { outcome, inspectionNotes }, req.user);
    res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};
