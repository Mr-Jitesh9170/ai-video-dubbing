const express = require("express");

const upload = require("../middleware/upload.middleware");
const {
    uploadVideo
} = require("../controllers/video.controller");

const router = express.Router();

router.post(
    "/upload",
    upload.single("video"),
    uploadVideo
);

module.exports = router;