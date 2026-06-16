import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

/** รูปแบบที่ ThrottlerGuard ต้องการ (ไม่ได้ re-export จาก index ของ throttler) */
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-backed rate limiter storage — แชร์ counter ข้าม instance
 * (in-memory ของ default จะนับแยกแต่ละเครื่อง ทำให้ limit ทะลุตอนสเกลหลาย pod)
 *
 * จำลอง semantics ของ ThrottlerStorageService (fixed window + block) แบบ atomic
 * ด้วย Lua script — ttl/blockDuration หน่วยเป็น ms, ค่าที่คืน timeToExpire เป็นวินาที
 *
 * Fail-open: ถ้า Redis ล่ม → อนุญาต request (กันไม่ให้ระบบล่มตาม rate-limiter)
 */
const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

-- กำลังถูกบล็อกอยู่ → ไม่เพิ่ม hit, คืนสถานะบล็อก
local blockPttl = redis.call('PTTL', blockKey)
if blockPttl > 0 then
  local hits = tonumber(redis.call('GET', hitsKey) or '0')
  local hp = redis.call('PTTL', hitsKey)
  if hp < 0 then hp = 0 end
  return { hits, math.ceil(hp / 1000), 1, math.ceil(blockPttl / 1000) }
end

-- นับ hit ใหม่ภายใน window
local hits = redis.call('INCR', hitsKey)
if hits == 1 then
  redis.call('PEXPIRE', hitsKey, ttl)
end
local hitsPttl = redis.call('PTTL', hitsKey)
if hitsPttl < 0 then
  redis.call('PEXPIRE', hitsKey, ttl)
  hitsPttl = ttl
end

local isBlocked = 0
local timeToBlockExpire = 0
if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  isBlocked = 1
  timeToBlockExpire = math.ceil(blockDuration / 1000)
end

return { hits, math.ceil(hitsPttl / 1000), isBlocked, timeToBlockExpire }
`;

@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redis: Redis) {
    // อย่าให้ ioredis โยน unhandled error ตอน Redis ล่ม — log แล้ว fail-open
    this.redis.on('error', (err) =>
      this.logger.error(`Redis throttler error: ${err.message}`),
    );
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitsKey}:blocked`;

    try {
      const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
        (await this.redis.eval(
          INCREMENT_SCRIPT,
          2,
          hitsKey,
          blockKey,
          ttl,
          limit,
          blockDuration,
        )) as [number, number, number, number];

      return {
        totalHits,
        timeToExpire,
        isBlocked: isBlocked === 1,
        timeToBlockExpire,
      };
    } catch (err) {
      // Redis ใช้ไม่ได้ → ปล่อยผ่าน (ดีกว่าทำให้ทุก request ล้ม)
      this.logger.error(
        `Throttler fail-open (Redis unavailable): ${(err as Error).message}`,
      );
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}
