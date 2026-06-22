// Upstash Redis connection layer client with fallback mock variables for local/dev environments
export class MockRedis {
  constructor() {
    this.store = {};
  }

  async get(key) {
    // Return cached value if present
    return this.store[key] || null;
  }

  async set(key, value, options = {}) {
    this.store[key] = value;
    return 'OK';
  }

  async del(key) {
    delete this.store[key];
    return 1;
  }
}

let redisClient;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn('[Redis Client] UPSTASH_REDIS_REST_URL or Token is missing. Initializing Mock Cache store.');
  redisClient = new MockRedis();
} else {
  // If actual keys exist, connect using standard HTTP fetch client (Upstash spec)
  redisClient = {
    get: async (key) => {
      try {
        const res = await fetch(`${url}/get/${key}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        return data.result ? JSON.parse(data.result) : null;
      } catch (err) {
        console.error('Redis GET failed, falling back to mock:', err);
        return null;
      }
    },
    set: async (key, value, options = {}) => {
      try {
        const payload = JSON.stringify(value);
        await fetch(`${url}/set/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: payload
        });
        return 'OK';
      } catch (err) {
        console.error('Redis SET failed:', err);
        return 'FAIL';
      }
    },
    del: async (key) => {
      try {
        await fetch(`${url}/del/${key}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return 1;
      } catch (err) {
        console.error('Redis DEL failed:', err);
        return 0;
      }
    }
  };
}

export const redis = redisClient;
