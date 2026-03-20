
import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function clearKey() {
  const key = 'short:etLxGnZ';
  console.log(`Clearing key: ${key}`);
  const result = await redis.del(key);
  console.log(`Deleted ${result} keys`);
}

clearKey();
