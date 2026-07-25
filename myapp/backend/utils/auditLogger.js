const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry
 *
 * @param {Object} params
 * @param {String} params.actorType - ADMIN | SYSTEM
 * @param {String} params.actorId - Admin _id (optional)
 * @param {String} params.action - Action name (ex: SELLER_PAID)
 * @param {String} params.entityType - Entity type (ex: ORDER_ITEM)
 * @param {String} params.entityId - Mongo ObjectId (optional)
 * @param {Object} params.metadata - Extra details
 * @param {Object} params.req - Express request (for IP / UA)
 */
async function logAudit({
  actorType,
  actorId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  req,
}) {
  try {
    await AuditLog.create({
      actorType,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress:
        req?.headers["x-forwarded-for"] ||
        req?.socket?.remoteAddress ||
        "",
      userAgent: req?.headers["user-agent"] || "",
    });
  } catch (err) {
    // ⚠️ Audit logging must NEVER break main flow
    console.error("AUDIT LOG ERROR:", err.message);
  }
}

module.exports = logAudit;
