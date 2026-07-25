const premiumOnly = (req, res, next) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({
      message: "Premium subscription required",
    });
  }
  next();
};

module.exports = premiumOnly;
