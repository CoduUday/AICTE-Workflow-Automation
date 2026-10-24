import mongoose from 'mongoose';
import { env } from '../config/env.js';

const mongoStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Controller for GET /api/health
 */
export const getHealth = async (req, res, next) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const isDbConnected = mongoState === 1;

    const healthData = {
      status: isDbConnected ? 'healthy' : 'degraded',
      service: 'AICTE Approval Workflow Automation Backend',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      database: {
        status: mongoStateMap[mongoState] || 'unknown',
        readyState: mongoState,
        connected: isDbConnected,
      },
    };

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};
