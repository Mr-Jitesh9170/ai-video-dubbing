const videoService = require("../services/video.service");

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required"
      });
    }

    const {
      sourceLanguage,
      targetLanguage
    } = req.body;

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message:
          "sourceLanguage and targetLanguage are required"
      });
    }

    const result = await videoService.createDubbingJob({
      file: req.file,
      sourceLanguage,
      targetLanguage
    });

    return res.status(202).json({
      success: true,
      message: "Video uploaded and dubbing job queued",
      data: {
        videoId: result.video._id,
        jobId: result.dubbingJob._id,
        status: result.dubbingJob.status
      }
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadVideo
};