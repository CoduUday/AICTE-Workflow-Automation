import { applicationService } from '../services/application.service.js';
import { workflowService } from '../services/workflow.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body, req.user);
    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const { applications, pagination } = await applicationService.getApplications(req.query, req.user);
    res.status(200).json({
      success: true,
      data: applications,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (req, res, next) => {
  try {
    const nextStage = req.body.nextStage || req.body.currentStage;
    const { notes, action } = req.body;

    if (!nextStage) {
      throw new AppError('Next workflow stage (nextStage) is required', 400);
    }

    const application = await applicationService.getApplicationById(req.params.id, req.user);
    const updatedApplication = await workflowService.executeTransition(application, nextStage, {
      notes,
      action,
      actorUser: req.user,
    });

    res.status(200).json({
      success: true,
      data: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await applicationService.getDocuments(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const addDocument = async (req, res, next) => {
  try {
    const document = await applicationService.addDocument(req.params.id, req.body, req.user);
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};
