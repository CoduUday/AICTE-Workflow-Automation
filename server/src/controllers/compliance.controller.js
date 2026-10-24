import { complianceService } from '../services/compliance.service.js';

export const getComplianceItems = async (req, res, next) => {
  try {
    const { items, pagination } = await complianceService.getComplianceItems(req.query, req.user);
    res.status(200).json({
      success: true,
      data: items,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getComplianceById = async (req, res, next) => {
  try {
    const item = await complianceService.getComplianceById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const createComplianceItem = async (req, res, next) => {
  try {
    const item = await complianceService.createComplianceItem(req.body, req.user);
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComplianceItem = async (req, res, next) => {
  try {
    const item = await complianceService.updateComplianceItem(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const submitEvidence = async (req, res, next) => {
  try {
    const item = await complianceService.submitEvidence(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEvidence = async (req, res, next) => {
  try {
    const { evidenceId } = req.params;
    const { verificationStatus, remarks } = req.body;
    const item = await complianceService.verifyEvidence(
      req.params.id,
      evidenceId,
      { verificationStatus, remarks },
      req.user
    );
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};
