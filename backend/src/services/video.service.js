const Video = require("../models/Video");
const DubbingJob = require("../models/DubbingJob");
const dubbingQueue = require("../queue/dubbing.queue");

const createDubbingJob = async ({
    file,
    sourceLanguage,
    targetLanguage
}) => {
    const video = await Video.create({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
        status: "uploaded"
    });

    const dubbingJob = await DubbingJob.create({
        videoId: video._id,
        sourceLanguage,
        targetLanguage,
        status: "queued"
    });

    await dubbingQueue.add("dub-video", {
        jobId: dubbingJob._id.toString(),
        videoId: video._id.toString(),
        videoPath: file.path,
        sourceLanguage,
        targetLanguage
    });

    return {
        video,
        dubbingJob
    };
};

module.exports = {
    createDubbingJob
};