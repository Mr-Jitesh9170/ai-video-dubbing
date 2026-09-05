const mongoose = require("mongoose");

const dubbingJobSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },

    sourceLanguage: {
      type: String,
      required: true
    },

    targetLanguage: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued"
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    error: {
      type: String,
      default: null
    },

    outputPath: {
      type: String,
      default: null
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DubbingJob", dubbingJobSchema);