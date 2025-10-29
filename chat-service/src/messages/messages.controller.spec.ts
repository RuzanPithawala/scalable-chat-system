import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';

describe('MessagesController', () => {
  let controller: MessagesController;
  let messagesService: jest.Mocked<MessagesService>;

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      chatId: 'test-room',
      userId: 'user-1',
      username: 'alice',
      displayName: 'alice',
      content: 'Hello',
      sequence: 1,
      createdAt: new Date('2025-10-26T10:00:00Z'),
    },
    {
      id: 'msg-2',
      chatId: 'test-room',
      userId: 'user-2',
      username: 'bob',
      displayName: 'bob',
      content: 'Hi there',
      sequence: 2,
      createdAt: new Date('2025-10-26T10:01:00Z'),
    },
    {
      id: 'msg-3',
      chatId: 'test-room',
      userId: 'user-1',
      username: 'alice',
      displayName: 'alice',
      content: 'How are you?',
      sequence: 3,
      createdAt: new Date('2025-10-26T10:02:00Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            getMessages: jest.fn(),
            getMessageCount: jest.fn(),
            createMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    messagesService = module.get(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMessages', () => {
    it('should return messages for a given chatId', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      const result = await controller.getMessages('test-room', undefined, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 0);
      expect(result).toEqual(mockMessages);
    });

    it('should use default limit of 50 when not provided', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', undefined, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 0);
    });

    it('should use default offset of 0 when not provided', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', 100, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 100, 0);
    });

    it('should accept custom limit parameter', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', 100, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 100, 0);
    });

    it('should accept custom offset parameter', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', undefined, 50);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 50);
    });

    it('should accept both custom limit and offset parameters', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', 100, 200);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 100, 200);
    });

    it('should return empty array when no messages exist', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue([]);

      // Act
      const result = await controller.getMessages('empty-room', undefined, undefined);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      messagesService.getMessages.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        controller.getMessages('test-room', undefined, undefined)
      ).rejects.toThrow('Database error');
    });

    it('should work with different chatId values', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('general', undefined, undefined);
      await controller.getMessages('tech', undefined, undefined);
      await controller.getMessages('gaming', undefined, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('general', 50, 0);
      expect(messagesService.getMessages).toHaveBeenCalledWith('tech', 50, 0);
      expect(messagesService.getMessages).toHaveBeenCalledWith('gaming', 50, 0);
    });

    it('should handle large offset values for pagination', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue([]);

      // Act
      const result = await controller.getMessages('test-room', 50, 10000);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 10000);
      expect(result).toEqual([]);
    });

    it('should return messages in order returned by service', async () => {
      // Arrange
      const orderedMessages = [...mockMessages].reverse();
      messagesService.getMessages.mockResolvedValue(orderedMessages);

      // Act
      const result = await controller.getMessages('test-room', undefined, undefined);

      // Assert
      expect(result).toEqual(orderedMessages);
      expect(result[0].sequence).toBe(3);
      expect(result[2].sequence).toBe(1);
    });

    it('should handle zero limit', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue([]);

      // Act
      await controller.getMessages('test-room', 0, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 0);
    });

    it('should use default limit when undefined is provided', async () => {
        // Arrange
        messagesService.getMessages.mockResolvedValue([]);

        // Act
        await controller.getMessages('test-room', undefined, undefined);

        // Assert
        expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 0);
    });

    it('should handle very large limit values', async () => {
      // Arrange
      messagesService.getMessages.mockResolvedValue(mockMessages);

      // Act
      await controller.getMessages('test-room', 999999, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 999999, 0);
    });
  });

  describe('getMessageCount', () => {
    it('should return message count for a given chatId', async () => {
      // Arrange
      messagesService.getMessageCount.mockResolvedValue(42);

      // Act
      const result = await controller.getMessageCount('test-room');

      // Assert
      expect(messagesService.getMessageCount).toHaveBeenCalledWith('test-room');
      expect(result).toEqual({ count: 42 });
    });

    it('should return 0 count for empty chat', async () => {
      // Arrange
      messagesService.getMessageCount.mockResolvedValue(0);

      // Act
      const result = await controller.getMessageCount('empty-room');

      // Assert
      expect(result).toEqual({ count: 0 });
    });

    it('should return count in correct format', async () => {
      // Arrange
      messagesService.getMessageCount.mockResolvedValue(123);

      // Act
      const result = await controller.getMessageCount('test-room');

      // Assert
      expect(result).toHaveProperty('count');
      expect(typeof result.count).toBe('number');
      expect(result.count).toBe(123);
    });

    it('should handle service errors', async () => {
      // Arrange
      messagesService.getMessageCount.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.getMessageCount('test-room')).rejects.toThrow('Database error');
    });

    it('should work with different chatId values', async () => {
      // Arrange
      messagesService.getMessageCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(30);

      // Act
      const result1 = await controller.getMessageCount('room-1');
      const result2 = await controller.getMessageCount('room-2');
      const result3 = await controller.getMessageCount('room-3');

      // Assert
      expect(result1.count).toBe(10);
      expect(result2.count).toBe(20);
      expect(result3.count).toBe(30);
    });

    it('should handle large message counts', async () => {
      // Arrange
      messagesService.getMessageCount.mockResolvedValue(1000000);

      // Act
      const result = await controller.getMessageCount('popular-room');

      // Assert
      expect(result.count).toBe(1000000);
    });

    it('should call service method exactly once', async () => {
      // Arrange
      messagesService.getMessageCount.mockResolvedValue(50);

      // Act
      await controller.getMessageCount('test-room');

      // Assert
      expect(messagesService.getMessageCount).toHaveBeenCalledTimes(1);
    });

    it('should pass chatId to service', async () => {
      // Arrange
      const chatId = 'specific-room-id-12345';
      messagesService.getMessageCount.mockResolvedValue(15);

      // Act
      await controller.getMessageCount(chatId);

      // Assert
      expect(messagesService.getMessageCount).toHaveBeenCalledWith(chatId);
    });
  });

  describe('edge cases', () => {
    it('should handle very long chatId strings', async () => {
      // Arrange
      const longChatId = 'a'.repeat(1000);
      messagesService.getMessages.mockResolvedValue([]);

      // Act
      await controller.getMessages(longChatId, undefined, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith(longChatId, 50, 0);
    });

    it('should handle special characters in chatId', async () => {
      // Arrange
      const specialChatId = 'room-!@#$%^&*()';
      messagesService.getMessages.mockResolvedValue([]);

      // Act
      await controller.getMessages(specialChatId, undefined, undefined);

      // Assert
      expect(messagesService.getMessages).toHaveBeenCalledWith(specialChatId, 50, 0);
    });
  });
});