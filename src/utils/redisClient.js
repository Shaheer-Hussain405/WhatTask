import { createClient } from "redis";

const client = createClient({
  url: 'redis://localhost:6379'
});


client.connect()
  .then(() => console.log('Connected to Redis!'))
  .catch((err) => console.error('Redis connection error:', err));

// Handle errors after connection
client.on('error', (err) => console.error('Redis error:', err));

export default client;
