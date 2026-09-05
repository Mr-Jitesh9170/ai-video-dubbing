const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },

    filename: {
      type: String,
      required: true
    },

    path: {
      type: String,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true
    },

    duration: {
      type: Number,
      default: null
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Video", videoSchema);