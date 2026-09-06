const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { Worker } = require("bullmq");

const DubbingJob = require("../src/models/DubbingJob");
const { runFFmpeg } = require("../src/utils/ffmpeg");

const connection = {
    host: process.env.REDIS_HOST || "redis",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
};

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Worker MongoDB connected");
    } catch (error) {
        console.error(
            "❌ Worker MongoDB connection failed:",
            error.message
        );

        throw error;
    }
};

const processDubbingJob = async (job) => {
    console.log("=================================");
    console.log("🎬 Dubbing job received");
    console.log("BullMQ Job ID:", job.id);
    console.log("Database Job ID:", job.data.jobId);
    console.log("Video ID:", job.data.videoId);
    console.log(
        "Languages:",
        `${job.data.sourceLanguage} → ${job.data.targetLanguage}`
    );
    console.log("=================================");

    let dubbingJob;

    try {
        /*
         * Find the corresponding MongoDB job.
         */
        dubbingJob = await DubbingJob.findById(job.data.jobId);

        if (!dubbingJob) {
            throw new Error(
                `DubbingJob not found: ${job.data.jobId}`
            );
        }

        /*
         * Mark job as processing.
         */
        dubbingJob.status = "processing";
        dubbingJob.progress = 10;
        dubbingJob.error = null;
        dubbingJob.attempts += 1;

        await dubbingJob.save();

        console.log("🔄 Job status: processing");
        console.log("📊 Progress: 10%");

        /*
         * Make sure temp directory exists.
         */
        const tempDirectory = path.join(
            process.cwd(),
            "temp"
        );

        if (!fs.existsSync(tempDirectory)) {
            fs.mkdirSync(tempDirectory, {
                recursive: true
            });
        }

        /*
         * Generate a unique WAV file path.
         *
         * Example:
         * temp/68c123...wav
         */
        const audioPath = path.join(
            tempDirectory,
            `${job.data.jobId}.wav`
        );

        console.log("🎵 Extracting audio...");
        console.log("Input:", job.data.videoPath);
        console.log("Output:", audioPath);

        /*
         * Extract audio using FFmpeg.
         *
         * -y              overwrite existing file
         * -i              input video
         * -vn             remove video stream
         * -ac 1           mono audio
         * -ar 16000       16 kHz sample rate
         * -c:a pcm_s16le  16-bit PCM WAV
         */
        await runFFmpeg([
            "-y",
            "-i",
            job.data.videoPath,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            audioPath
        ]);

        console.log("🎵 Audio extracted successfully");
        console.log("Audio path:", audioPath);

        /*
         * Update progress after FFmpeg.
         */
        dubbingJob.progress = 30;

        await dubbingJob.save();

        console.log("📊 Progress: 30%");

        /*
         * We intentionally stop here for now.
         *
         * Next stage:
         *
         * WAV audio
         *      ↓
         * STT
         *      ↓
         * transcript
         */
        return {
            success: true,
            audioPath
        };
    } catch (error) {
        console.error("❌ Dubbing job failed:");
        console.error(error.message);

        /*
         * Update MongoDB job status.
         */
        if (dubbingJob) {
            dubbingJob.status = "failed";
            dubbingJob.error = error.message;

            await dubbingJob.save();
        }

        /*
         * Throw the error so BullMQ knows
         * the job failed and can retry it.
         */
        throw error;
    }
};

const worker = new Worker(
    "video-dubbing",
    processDubbingJob,
    {
        connection
    }
);

worker.on("ready", () => {
    console.log("🚀 Dubbing worker is ready");
    console.log("📡 Listening to queue: video-dubbing");
});

worker.on("completed", (job, result) => {
    console.log(
        `🎉 BullMQ job ${job.id} completed successfully`
    );

    console.log("Result:", result);
});

worker.on("failed", (job, error) => {
    console.error(
        `❌ BullMQ job ${job?.id} failed:`,
        error.message
    );
});

worker.on("error", (error) => {
    console.error(
        "❌ Worker error:",
        error.message
    );
});

const startWorker = async () => {
    try {
        await connectDatabase();

        console.log("🚀 Worker started successfully");
    } catch (error) {
        console.error(
            "❌ Worker startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startWorker(); 