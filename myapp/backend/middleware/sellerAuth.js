const jwt = require("jsonwebtoken");

/**
 * ✅ SELLER AUTH MIDDLEWARE
 * - Verifies JWT
 * - Allows ONLY role === "seller"
 */
module.exports = function sellerAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== "seller") {
      return res.status(403).json({ message: "Seller access only" });
    }

    req.seller = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("SELLER AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
