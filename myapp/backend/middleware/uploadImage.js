const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// store file in memory
const storage = multer.memoryStorage();

// internal multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("image");

// guarded middleware
const uploadMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      console.error("MULTER ERROR:", err);
      return res.status(400).json({
        success: false,
        message: "Invalid or corrupted image upload",
      });
    }
    next();
  });
};

// upload buffer to cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

module.exports = {
  uploadMiddleware,
  uploadToCloudinary,
};
