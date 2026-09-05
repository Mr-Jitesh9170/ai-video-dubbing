const Redis = require("ioredis");

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

redisClient.on("connect", () => {
  console.log("🔄 Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis ready");
});

redisClient.on("error", (error) => {
  console.error("❌ Redis error:", error.message);
});

const connectRedis = async () => {
  if (redisClient.status !== "ready") {
    await new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = (error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        redisClient.off("ready", onReady);
        redisClient.off("error", onError);
      };

      redisClient.once("ready", onReady);
      redisClient.once("error", onError);
    });
  }
};

module.exports = {
  redisClient,
  connectRedis
};