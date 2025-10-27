import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private publisher: Redis;
  private subscriber: Redis;
  private messageHandlers: Map<string, (message: any) => void> = new Map();

  async onModuleInit() {
    // Initialize Redis connections
    const redisConfig = {
      host: process.env.REDIS_HOST || 'redis-master',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    // Publisher connection (for publishing messages and INCR operations)
    this.publisher = new Redis(redisConfig);

    // Subscriber connection (for receiving messages via pub/sub)
    this.subscriber = this.publisher.duplicate();

    // Error handlers
    this.publisher.on('error', (err) => {
      console.error('Redis Publisher Error:', err);
    });

    this.subscriber.on('error', (err) => {
      console.error('Redis Subscriber Error:', err);
    });

    // Connection handlers
    this.publisher.on('connect', () => {
      console.log('✅ Redis Publisher connected');
    });

    this.subscriber.on('connect', () => {
      console.log('✅ Redis Subscriber connected');
    });

    this.publisher.on('ready', () => {
      console.log('✅ Redis Publisher ready');
    });

    this.subscriber.on('ready', () => {
      console.log('✅ Redis Subscriber ready');
    });

    // Handle messages from subscriber
    this.subscriber.on('message', (channel: string, message: string) => {
      const handler = this.messageHandlers.get(channel);
      if (handler) {
        try {
          const parsedMessage = JSON.parse(message);
          handler(parsedMessage);
        } catch (error) {
          console.error(`Error parsing message from channel ${channel}:`, error);
        }
      }
    });

    // Wait for connections to be ready
    await Promise.all([
      this.publisher.ping(),
      this.subscriber.ping(),
    ]);

    console.log('Redis service initialized');
  }

  /**
   * Get the publisher instance for direct Redis operations
   * Used for atomic operations like INCR for sequence numbers
   */
  getPublisher(): Redis {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized');
    }
    return this.publisher;
  }

  /**
   * Get the subscriber instance
   */
  getSubscriber(): Redis {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    return this.subscriber;
  }

  /**
   * Publish a message to a Redis channel
   * @param channel The channel name
   * @param message The message object (will be JSON stringified)
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);
      await this.publisher.publish(channel, messageStr);
      console.log(`📤 Published to ${channel}`);
    } catch (error) {
      console.error(`Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a Redis channel
   * @param channel The channel name
   * @param callback Function to call when message is received
   */
  subscribe(channel: string, callback: (message: any) => void): void {
    // Store the callback
    this.messageHandlers.set(channel, callback);

    // Subscribe to the channel
    this.subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${channel}:`, err);
        return;
      }
      console.log(`📥 Subscribed to ${channel}`);
    });
  }

  /**
   * Unsubscribe from a Redis channel
   * @param channel The channel name
   */
  async unsubscribe(channel: string): Promise<void> {
    this.messageHandlers.delete(channel);
    await this.subscriber.unsubscribe(channel);
    console.log(`📤 Unsubscribed from ${channel}`);
  }

  /**
   * Get a value from Redis
   * @param key The key to retrieve
   */
  async get(key: string): Promise<string | null> {
    return this.publisher.get(key);
  }

  /**
   * Set a value in Redis
   * @param key The key
   * @param value The value
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.publisher.setex(key, ttl, value);
    } else {
      await this.publisher.set(key, value);
    }
  }

  /**
   * Increment a value in Redis (atomic operation)
   * @param key The key to increment
   * @returns The new value after increment
   */
  async increment(key: string): Promise<number> {
    return this.publisher.incr(key);
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    await this.publisher.del(key);
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.publisher?.status === 'ready' && this.subscriber?.status === 'ready';
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    console.log('Disconnecting Redis connections...');
    
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    
    if (this.publisher) {
      await this.publisher.quit();
    }
    
    console.log('Redis connections closed');
  }
}