const activeAdminSessions = new Map();

function adminOnline(adminId) {
  activeAdminSessions.set(adminId, {
    adminId,
    lastActive: new Date(),
  });
}

function adminOffline(adminId) {
  activeAdminSessions.delete(adminId);
}

function getActiveAdmins() {
  return Array.from(activeAdminSessions.values());
}

module.exports = {
  adminOnline,
  adminOffline,
  getActiveAdmins,
};