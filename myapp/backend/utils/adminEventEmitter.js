const { getIO } = require("../socket");
const AdminNotification = require("../models/AdminNotification");

async function emitAdminEvent(message, type = "SYSTEM") {
  try {

    /* Save notification in DB */

    await AdminNotification.create({
      message,
      type,
    });

    /* Emit realtime event */

    const io = getIO();

    io.emit("admin_event", {
      message,
      type,
      createdAt: new Date(),
    });

    console.log("🔔 Admin Event:", message);

  } catch (err) {
    console.log("Admin event emit failed:", err.message);
  }
}

module.exports = emitAdminEvent;