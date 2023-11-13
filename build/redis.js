"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
// Initialize the Redis client
const redis = new ioredis_1.default({
    host: "localhost",
    port: 6379, // Redis server port
    // Optionally, specify a password if your Redis server requires authentication
    // password: 'your_password',
    // Enable data persistence to save data to disk
    // This is the default behavior, so it's optional
    //persistence: true,
});
// Handle Redis connection errors
redis.on("error", (error) => {
    console.error("Redis Error:", error);
});
exports.default = redis;
//# sourceMappingURL=redis.js.map