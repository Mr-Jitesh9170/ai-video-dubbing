const Redis = require("ioredis");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (error) => {
    console.error("❌ Redis error:", error.message);
});

module.exports = redis;