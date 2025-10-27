import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';
import { RedisService } from '../redis/redis.service';
import { SendMessageDto } from './dto/message.dto';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepository: jest.Mocked<Repository<Message>>;
  let redisService: jest.Mocked<RedisService>;

  // Mock Redis client
  const mockRedisClient = {
    incr: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getPublisher: jest.fn(() => mockRedisClient),
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageRepository = module.get(getRepositoryToken(Message));
    redisService = module.get(RedisService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    const mockDto: SendMessageDto = {
      chatId: 'test-room',
      userId: 'user-123',
      username: 'testuser',
      content: 'Hello World',
    };

    const mockSavedMessage: Message = {
      id: 'msg-123',
      chatId: 'test-room',
      userId: 'user-123',
      username: 'testuser',
      content: 'Hello World',
      sequence: 1,
      createdAt: new Date('2025-10-26T10:00:00Z'),
    };

    it('should generate sequence number from Redis INCR', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValue(1);
      messageRepository.create.mockReturnValue(mockSavedMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      await service.createMessage(mockDto);

      // Assert
      expect(mockRedisClient.incr).toHaveBeenCalledWith('chat:test-room:sequence');
      expect(mockRedisClient.incr).toHaveBeenCalledTimes(1);
    });

    it('should create message with sequence number', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValue(5);
      messageRepository.create.mockReturnValue(mockSavedMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      await service.createMessage(mockDto);

      // Assert
      expect(messageRepository.create).toHaveBeenCalledWith({
        chatId: mockDto.chatId,
        userId: mockDto.userId,
        username: mockDto.username,
        content: mockDto.content,
        sequence: 5,
      });
    });

    it('should save message to database', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValue(1);
      const createdMessage = { ...mockSavedMessage };
      messageRepository.create.mockReturnValue(createdMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      const result = await service.createMessage(mockDto);

      // Assert
      expect(messageRepository.save).toHaveBeenCalledWith(createdMessage);
      expect(result).toEqual(mockSavedMessage);
    });

    it('should publish message to Redis with ISO date', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValue(1);
      messageRepository.create.mockReturnValue(mockSavedMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      await service.createMessage(mockDto);

      // Assert
      expect(redisService.publish).toHaveBeenCalledWith('chat-messages', {
        chatId: mockDto.chatId,
        message: {
          ...mockSavedMessage,
          createdAt: '2025-10-26T10:00:00.000Z',
        },
      });
    });

    it('should return saved message', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValue(1);
      messageRepository.create.mockReturnValue(mockSavedMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      const result = await service.createMessage(mockDto);

      // Assert
      expect(result).toEqual(mockSavedMessage);
      expect(result.sequence).toBe(1);
    });

    it('should handle multiple messages with incrementing sequences', async () => {
      // Arrange
      mockRedisClient.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3);
      messageRepository.create.mockReturnValue(mockSavedMessage);
      messageRepository.save.mockResolvedValue(mockSavedMessage);

      // Act
      await service.createMessage(mockDto);
      await service.createMessage(mockDto);
      await service.createMessage(mockDto);

      // Assert
      expect(mockRedisClient.incr).toHaveBeenCalledTimes(3);
      expect(messageRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ sequence: 1 }));
      expect(messageRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ sequence: 2 }));
      expect(messageRepository.create).toHaveBeenNthCalledWith(3, expect.objectContaining({ sequence: 3 }));
    });
  });

  describe('getMessages', () => {
    const chatId = 'test-room';
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        chatId,
        userId: 'user-1',
        username: 'user1',
        content: 'First',
        sequence: 1,
        createdAt: new Date('2025-10-26T10:00:00Z'),
      },
      {
        id: 'msg-2',
        chatId,
        userId: 'user-2',
        username: 'user2',
        content: 'Second',
        sequence: 2,
        createdAt: new Date('2025-10-26T10:01:00Z'),
      },
      {
        id: 'msg-3',
        chatId,
        userId: 'user-3',
        username: 'user3',
        content: 'Third',
        sequence: 3,
        createdAt: new Date('2025-10-26T10:02:00Z'),
      },
    ];

    it('should get latest messages ordered by sequence DESC', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(3);
      messageRepository.find.mockResolvedValue([...mockMessages].reverse());

      // Act
      const result = await service.getMessages(chatId, 50, 0);

      // Assert
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { chatId },
        order: {
          sequence: 'DESC',
          createdAt: 'DESC',
        },
        take: 50,
      });
    });

    it('should reverse messages to show oldest first', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(3);
      // Database returns DESC order
      messageRepository.find.mockResolvedValue([mockMessages[2], mockMessages[1], mockMessages[0]]);

      // Act
      const result = await service.getMessages(chatId, 50, 0);

      // Assert - Should be reversed to ASC
      expect(result[0].sequence).toBe(1);
      expect(result[1].sequence).toBe(2);
      expect(result[2].sequence).toBe(3);
    });

    it('should limit number of messages returned', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(100);
      messageRepository.find.mockResolvedValue(mockMessages);

      // Act
      await service.getMessages(chatId, 10, 0);

      // Assert
      expect(messageRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should support pagination with offset', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(100);
      messageRepository.find.mockResolvedValue(mockMessages);

      // Act
      await service.getMessages(chatId, 50, 50);

      // Assert
      expect(messageRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 50,
        })
      );
    });

    it('should not include skip when offset is 0', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(3);
      messageRepository.find.mockResolvedValue(mockMessages);

      // Act
      await service.getMessages(chatId, 50, 0);

      // Assert
      expect(messageRepository.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          skip: expect.anything(),
        })
      );
    });

    it('should return empty array when no messages exist', async () => {
      // Arrange
      messageRepository.count.mockResolvedValue(0);
      messageRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getMessages(chatId, 50, 0);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getMessageCount', () => {
    it('should return correct message count for a chat', async () => {
      // Arrange
      const chatId = 'test-room';
      messageRepository.count.mockResolvedValue(42);

      // Act
      const result = await service.getMessageCount(chatId);

      // Assert
      expect(messageRepository.count).toHaveBeenCalledWith({
        where: { chatId },
      });
      expect(result).toBe(42);
    });

    it('should return 0 when chat has no messages', async () => {
      // Arrange
      const chatId = 'empty-room';
      messageRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.getMessageCount(chatId);

      // Assert
      expect(result).toBe(0);
    });
  });
});