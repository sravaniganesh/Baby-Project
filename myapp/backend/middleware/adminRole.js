const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          message: "Admin authentication required",
        });
      }

      const adminRole = req.admin.role;

      /* ===============================
         LEGACY ROLE SUPPORT
         ADMIN behaves like SUPER_ADMIN
      =============================== */

      const normalizedRole =
        adminRole === "ADMIN" ? "SUPER_ADMIN" : adminRole;

      if (!roles.includes(normalizedRole)) {
        return res.status(403).json({
          message: "Admin does not have permission",
        });
      }

      next();
    } catch (err) {
      console.error("ADMIN ROLE CHECK ERROR:", err);
      res.status(500).json({
        message: "Permission validation failed",
      });
    }
  };
};

module.exports = allowRoles;