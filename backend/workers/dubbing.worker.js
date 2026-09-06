const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { Worker } = require("bullmq");

const DubbingJob = require("../src/models/DubbingJob");

const { runFFmpeg } = require("../src/utils/ffmpeg");

const { transcribeAudio } = require("../src/services/stt.service");
const { translateText } = require(
    "../src/services/translation.service"
);
const { synthesizeSpeech } = require("../src/services/tts.service");


const connection = {
    host: process.env.REDIS_HOST || "redis",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
};


const connectDatabase = async () => {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "✅ Worker MongoDB connected"
        );

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

    console.log(
        "BullMQ Job ID:",
        job.id
    );

    console.log(
        "Database Job ID:",
        job.data.jobId
    );

    console.log(
        "Video ID:",
        job.data.videoId
    );

    console.log(
        "Languages:",
        `${job.data.sourceLanguage} → ${job.data.targetLanguage}`
    );

    console.log("=================================");


    let dubbingJob;


    try {

        /*
        =================================
        DATABASE JOB
        =================================
        */

        dubbingJob = await DubbingJob.findById(
            job.data.jobId
        );


        if (!dubbingJob) {

            throw new Error(
                `DubbingJob not found: ${job.data.jobId}`
            );
        }


        dubbingJob.status = "processing";

        dubbingJob.progress = 10;

        dubbingJob.error = null;

        dubbingJob.attempts += 1;


        await dubbingJob.save();


        console.log(
            "🔄 Job status: processing"
        );

        console.log(
            "📊 Progress: 10%"
        );


        /*
        =================================
        TEMP DIRECTORY
        =================================
        */

        const tempDirectory = path.join(
            process.cwd(),
            "temp"
        );


        if (!fs.existsSync(tempDirectory)) {

            fs.mkdirSync(
                tempDirectory,
                {
                    recursive: true
                }
            );
        }


        /*
        =================================
        AUDIO EXTRACTION
        =================================
        */

        const audioPath = path.join(
            tempDirectory,
            `${job.data.jobId}.wav`
        );


        console.log(
            "🎵 Extracting audio..."
        );

        console.log(
            "Input:",
            job.data.videoPath
        );

        console.log(
            "Output:",
            audioPath
        );


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


        console.log(
            "🎵 Audio extracted successfully"
        );

        console.log(
            "Audio path:",
            audioPath
        );


        dubbingJob.progress = 30;

        await dubbingJob.save();


        console.log(
            "📊 Progress: 30%"
        );


        /*
        =================================
        SPEECH TO TEXT
        =================================
        */

        console.log(
            "🎙️ Starting speech-to-text..."
        );


        dubbingJob.progress = 40;

        await dubbingJob.save();


        console.log(
            "📊 Progress: 40%"
        );


        const transcription = await transcribeAudio(
            audioPath
        );


        console.log(
            "📝 Transcription received"
        );

        console.log(
            "Detected language:",
            transcription.language
        );

        console.log(
            "Transcript:",
            transcription.text
        );


        dubbingJob.progress = 50;

        await dubbingJob.save();


        console.log(
            "📊 Progress: 50%"
        );


        /*
        =================================
        TRANSLATION
        =================================
        */

        console.log(
            "🌐 Starting translation..."
        );


        const translation = await translateText({

            text: transcription.text,

            sourceLanguage:
                job.data.sourceLanguage,

            targetLanguage:
                job.data.targetLanguage
        });


        console.log(
            "📝 Translation received"
        );

        console.log(
            "Translated text:",
            translation.text
        );


        dubbingJob.progress = 65;

        await dubbingJob.save();


        console.log(
            "📊 Progress: 65%"
        );


        /*
        =================================
        TEMPORARY RESULT
        =================================
        */

        console.log("🔊 Starting text-to-speech...");

        const tts = await synthesizeSpeech({
            text: translation.text,
            language: job.data.targetLanguage
        });

        console.log("🔊 TTS audio generated");
        console.log(
            "TTS audio path:",
            tts.audioPath
        );

        // TTS container uses /shared
        // Worker uses /app/temp
        const ttsAudioPath = tts.audioPath.replace(
            "/shared/",
            "/app/temp/"
        );

        console.log(
            "Worker TTS audio path:",
            ttsAudioPath
        );

        dubbingJob.progress = 75;
        await dubbingJob.save();

        console.log("📊 Progress: 75%");


        return {
            success: true,
            audioPath,
            transcription,
            translation,
            tts: {
                ...tts,
                audioPath: ttsAudioPath
            }
        };

    } catch (error) {

        console.error(
            "❌ Dubbing job failed:"
        );

        console.error(
            error.message
        );


        if (dubbingJob) {

            dubbingJob.status = "failed";

            dubbingJob.error =
                error.message;


            await dubbingJob.save();
        }


        throw error;
    }
};


const worker = new Worker(
    "video-dubbing",
    processDubbingJob,
    {
        connection,
        concurrency: 1,
        lockDuration: 10 * 60 * 1000,
        lockRenewTime: 60 * 1000
    }
);

worker.on("ready", () => {

    console.log(
        "🚀 Dubbing worker is ready"
    );

    console.log(
        "📡 Listening to queue: video-dubbing"
    );
});


worker.on("completed", (job, result) => {

    console.log(
        `🎉 BullMQ job ${job.id} completed successfully`
    );

    console.log(
        "Result:",
        result
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

    try {

        await connectDatabase();

        console.log(
            "🚀 Worker started successfully"
        );

    } catch (error) {

        console.error(
            "❌ Worker startup failed:",
            error.message
        );

        process.exit(1);
    }
};


startWorker();