const AuditLog = require("../models/AuditLog");

const logAudit = async ({
  actorType,
  actorId,
  action,
  entityType,
  entityId,
  metadata = {},
  req
}) => {
  try {

    await AuditLog.create({
      actorType,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.["user-agent"] || null
    });

  } catch (err) {

    console.error("AUDIT LOG ERROR:", err);

  }
};

module.exports = logAudit;