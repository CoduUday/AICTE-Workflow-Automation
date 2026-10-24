import { Alert } from '../models/Alert.js';
import { ROLES } from '../config/workflow.js';
import { AppError } from '../middleware/errorHandler.js';

export const alertService = {
  /**
   * Retrieve alerts scoped to the authenticated user's ID, role, or institution
   */
  async getAlerts(query = {}, actorUser) {
    const conditions = [];

    // 1. Direct user alerts
    conditions.push({ recipientId: actorUser._id?.toString() || actorUser.id });

    // 2. Role-wide alerts
    conditions.push({ recipientRole: actorUser.role });

    // 3. Institution-wide alerts
    if (actorUser.role === ROLES.INSTITUTION && actorUser.institutionId) {
      conditions.push({ institutionId: actorUser.institutionId });
    }

    // 4. Admin sees all alerts if explicitly requested or global
    if (actorUser.role === ROLES.ADMIN) {
      conditions.push({});
    }

    const filter = { $or: conditions };

    if (query.unreadOnly === true || query.unreadOnly === 'true') {
      filter.read = false;
    }

    if (query.severity && query.severity !== 'ALL') {
      filter.severity = query.severity;
    }

    if (query.type && query.type !== 'ALL') {
      filter.type = query.type;
    }

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    return alerts;
  },

  /**
   * Create an alert with strict deduplication and retry tracking
   */
  async createAlert(data) {
    if (!data.title) throw new AppError('Alert title is required', 400);
    if (!data.message) throw new AppError('Alert message is required', 400);

    // Deduplication check
    if (data.dedupKey) {
      const existing = await Alert.findOne({ dedupKey: data.dedupKey });
      if (existing) {
        // Increment retry count and avoid duplicate notification
        existing.retryCount += 1;
        if (data.dueAt) existing.dueAt = data.dueAt;
        await existing.save();
        return { alert: existing, isDuplicate: true };
      }
    }

    let id = data.id;
    if (!id) {
      let candidateId;
      let exists = true;
      let counter = 0;
      while (exists && counter < 10) {
        candidateId = `ALT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`;
        exists = await Alert.exists({ id: candidateId });
        counter++;
      }
      id = candidateId;
    }

    const newAlert = new Alert({
      id,
      recipientId: data.recipientId || null,
      recipientRole: data.recipientRole || null,
      institutionId: data.institutionId || null,
      institutionName: data.institutionName || null,
      applicationId: data.applicationId || null,
      complianceId: data.complianceId || null,
      type: data.type || 'INFO',
      title: data.title,
      message: data.message,
      severity: data.severity || 'info',
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      dedupKey: data.dedupKey || null,
      retryCount: 0,
      escalated: false,
      read: false,
    });

    await newAlert.save();
    return { alert: newAlert, isDuplicate: false };
  },

  /**
   * Acknowledge/read a single alert
   */
  async acknowledgeAlert(id, actorUser) {
    const alert = await Alert.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!alert) {
      throw new AppError(`Alert not found for ID: ${id}`, 404);
    }

    alert.read = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    return alert;
  },

  /**
   * Mark all alerts matching the user scope as read
   */
  async markAllAsRead(actorUser) {
    const conditions = [
      { recipientId: actorUser._id?.toString() || actorUser.id },
      { recipientRole: actorUser.role },
    ];
    if (actorUser.role === ROLES.INSTITUTION && actorUser.institutionId) {
      conditions.push({ institutionId: actorUser.institutionId });
    }

    await Alert.updateMany({ $or: conditions, read: false }, { $set: { read: true, acknowledgedAt: new Date() } });
    return { success: true };
  },

  /**
   * Escalate overdue alert to administrators
   */
  async escalateOverdueAlert(alert) {
    if (alert.escalated) return;

    alert.escalated = true;
    await alert.save();

    // Create high-priority escalation notice for Admin and Committee Officers
    await this.createAlert({
      recipientRole: ROLES.ADMIN,
      institutionId: alert.institutionId,
      institutionName: alert.institutionName,
      applicationId: alert.applicationId,
      complianceId: alert.complianceId,
      type: 'ESCALATION',
      title: `ESCALATION: ${alert.title}`,
      message: `Overdue compliance has exceeded allowable grace threshold without resolution: ${alert.message}`,
      severity: 'danger',
      dueAt: alert.dueAt,
      dedupKey: `ESCALATION_${alert.id}`,
    });
  },
};

export default alertService;
