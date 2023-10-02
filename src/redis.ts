import Redis from "ioredis";

// Initialize the Redis client
const redis = new Redis({
  host: "localhost", // Redis server host
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

export default redis;
