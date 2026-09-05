const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
};

const dubbingQueue = new Queue("video-dubbing", {
  connection,

  defaultJobOptions: {
    attempts: Number(process.env.MAX_RETRIES || 3),

    removeOnComplete: 100,

    removeOnFail: 100,

    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

module.exports = dubbingQueue;