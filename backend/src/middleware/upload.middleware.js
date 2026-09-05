const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, filename);
  }
});

const allowedExtensions = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv"
];

const allowedMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "application/octet-stream"
];

const fileFilter = (req, file, cb) => {
  console.log("📹 Uploaded file:");
  console.log("Original name:", file.originalname);
  console.log("MIME type:", file.mimetype);

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const isValidExtension =
    allowedExtensions.includes(extension);

  const isValidMimeType =
    allowedMimeTypes.includes(file.mimetype);

  if (!isValidExtension || !isValidMimeType) {
    return cb(
      new Error("Unsupported video format"),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      Number(process.env.MAX_UPLOAD_SIZE_MB || 500) *
      1024 *
      1024
  }
});

module.exports = upload;