const mongoose = require("mongoose");
const { Worker } = require("bullmq");

const DubbingJob = require("../src/models/DubbingJob");

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

        process.exit(1);
    }
};

const worker = new Worker(
    "video-dubbing",

    async (job) => {
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

        const dubbingJob = await DubbingJob.findById(
            job.data.jobId
        );

        if (!dubbingJob) {
            throw new Error(
                `DubbingJob not found: ${job.data.jobId}`
            );
        }

        // Mark job as processing
        dubbingJob.status = "processing";
        dubbingJob.progress = 10;
        dubbingJob.attempts += 1;

        await dubbingJob.save();

        console.log("🔄 Job status: processing");
        console.log("📊 Progress: 10%");

        // Temporary processing simulation
        await new Promise((resolve) =>
            setTimeout(resolve, 5000)
        );

        dubbingJob.progress = 100;
        dubbingJob.status = "completed";

        await dubbingJob.save();

        console.log("✅ Job completed");
        console.log("📊 Progress: 100%");

        return {
            success: true,
            jobId: job.data.jobId,
            videoId: job.data.videoId
        };
    },

    {
        connection,
        concurrency: Number(
            process.env.MAX_CONCURRENT_JOBS || 5
        )
    }
);

worker.on("ready", () => {
    console.log("🚀 Dubbing worker is ready");
    console.log("📡 Listening to queue: video-dubbing");
});

worker.on("completed", (job) => {
    console.log(
        `🎉 BullMQ job ${job.id} completed successfully`
    );
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
    await connectDatabase();
};

startWorker();