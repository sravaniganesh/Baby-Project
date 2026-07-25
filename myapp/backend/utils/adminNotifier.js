const { getIO } = require("../socket");

/**
 * Emit admin event to all admin dashboards
 */

function notifyAdmins(event, payload = {}) {
  try {
    const io = getIO();

    io.emit("admin_event", {
      type: event,
      message: payload.message || "",
      data: payload.data || {},
      createdAt: new Date(),
    });

  } catch (err) {
    console.error("ADMIN NOTIFICATION ERROR:", err.message);
  }
}

module.exports = notifyAdmins;