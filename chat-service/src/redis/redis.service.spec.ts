import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockPublisher: any;
  let mockSubscriber: any;

  beforeEach(async () => {
    // Create mock Redis clients
    mockPublisher = {
      on: jest.fn().mockReturnThis(),
      publish: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
      status: 'ready',
    };

    mockSubscriber = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((channel, callback) => {
        if (callback) callback(null);
        return Promise.resolve(1);
      }),
      unsubscribe: jest.fn(),
      quit: jest.fn(),
      status: 'ready',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Replace the real Redis clients with mocks
    service['publisher'] = mockPublisher;
    service['subscriber'] = mockSubscriber;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublisher', () => {
    it('should return the publisher client', () => {
      const publisher = service.getPublisher();
      expect(publisher).toBe(mockPublisher);
    });
  });

  describe('getSubscriber', () => {
    it('should return the subscriber client', () => {
      const subscriber = service.getSubscriber();
      expect(subscriber).toBe(mockSubscriber);
    });
  });

  describe('publish', () => {
    it('should publish message to Redis channel', async () => {
      const channel = 'chat-messages';
      const message = { chatId: 'test-room', content: 'Hello' };

      await service.publish(channel, message);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        channel,
        JSON.stringify(message)
      );
    });

    it('should handle publish errors', async () => {
      mockPublisher.publish.mockRejectedValue(new Error('Publish failed'));

      await expect(
        service.publish('test-channel', { test: 'data' })
      ).rejects.toThrow('Publish failed');
    });

    it('should serialize complex objects', async () => {
      const complexMessage = {
        chatId: 'room-1',
        message: {
          id: 'msg-1',
          user: { id: '123', name: 'John' },
          timestamp: new Date('2025-10-26T10:00:00Z'),
        },
      };

      await service.publish('test-channel', complexMessage);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'test-channel',
        JSON.stringify(complexMessage)
      );
    });

    it('should log successful publish', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.publish('test-channel', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith('📤 Published to test-channel');
      consoleSpy.mockRestore();
    });

    it('should stringify message before publishing', async () => {
      const message = { id: 1, name: 'test' };
      await service.publish('channel', message);

      const publishedData = mockPublisher.publish.mock.calls[0][1];
      expect(typeof publishedData).toBe('string');
      expect(JSON.parse(publishedData)).toEqual(message);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to Redis channel', () => {
      const channel = 'chat-messages';
      const callback = jest.fn();

      service.subscribe(channel, callback);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        channel,
        expect.any(Function)
      );
    });

    it('should handle multiple subscriptions to different channels', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribe('channel-1', callback1);
      service.subscribe('channel-2', callback2);

      expect(mockSubscriber.subscribe).toHaveBeenCalledTimes(2);
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('channel-1', expect.any(Function));
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('channel-2', expect.any(Function));
    });

    it('should handle subscription errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSubscriber.subscribe.mockImplementation((channel, callback) => {
        callback(new Error('Subscribe failed'));
        return Promise.resolve(0);
      });

      service.subscribe('test-channel', jest.fn());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log successful subscription', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.subscribe('test-channel', jest.fn());

      expect(consoleSpy).toHaveBeenCalledWith('📥 Subscribed to test-channel');
      consoleSpy.mockRestore();
    });

    it('should not throw error on valid subscription', () => {
      expect(() => {
        service.subscribe('valid-channel', jest.fn());
      }).not.toThrow();
    });
  });

  describe('Redis client initialization', () => {
    it('should have publisher client after initialization', () => {
      expect(service.getPublisher()).toBeDefined();
    });

    it('should have subscriber client after initialization', () => {
      expect(service.getSubscriber()).toBeDefined();
    });

    it('should set up publisher as separate client from subscriber', () => {
      const publisher = service.getPublisher();
      const subscriber = service.getSubscriber();
      
      expect(publisher).not.toBe(subscriber);
    });
  });

  describe('error resilience', () => {
    it('should handle publish with invalid data gracefully', async () => {
      // Even with circular references, JSON.stringify should be handled
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;

      await expect(
        service.publish('test', circularObj)
      ).rejects.toThrow();
    });

    it('should continue functioning after publish error', async () => {
      mockPublisher.publish
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(1);

      await expect(service.publish('test', { data: 1 })).rejects.toThrow();
      await expect(service.publish('test', { data: 2 })).resolves.not.toThrow();
    });
  });

  describe('data serialization', () => {
    it('should properly serialize dates in messages', async () => {
      const message = {
        timestamp: new Date('2025-10-26T10:00:00Z'),
        content: 'test',
      };

      await service.publish('channel', message);

      const serialized = mockPublisher.publish.mock.calls[0][1];
      const parsed = JSON.parse(serialized);
      
      expect(parsed.timestamp).toBe('2025-10-26T10:00:00.000Z');
    });

    it('should handle nested objects', async () => {
      const message = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      await service.publish('channel', message);

      const serialized = mockPublisher.publish.mock.calls[0][1];
      const parsed = JSON.parse(serialized);
      
      expect(parsed.level1.level2.level3.value).toBe('deep');
    });
  });
});