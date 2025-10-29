import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';
import { RedisService } from '../redis/redis.service';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dto/message.dto';
import { Message } from './message.entity';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: jest.Mocked<MessagesService>;
  let redisService: jest.Mocked<RedisService>;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;

  beforeEach(async () => {
    // Mock Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Mock Socket/Client
    mockClient = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: MessagesService,
          useValue: {
            createMessage: jest.fn(),
            getMessages: jest.fn(),
            getMessageCount: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            subscribe: jest.fn(),
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messagesService = module.get(MessagesService);
    redisService = module.get(RedisService);

    // Manually set the server
    gateway.server = mockServer;

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should subscribe to Redis chat-messages channel', async () => {
      // Act
      await gateway.onModuleInit();

      // Assert
      expect(redisService.subscribe).toHaveBeenCalledWith(
        'chat-messages',
        expect.any(Function)
      );
    });

    it('should emit messages received from Redis to correct room', async () => {
      let redisCallback: Function;
      
      redisService.subscribe.mockImplementation((channel, callback) => {
        redisCallback = callback;
      });

      // Initialize gateway
      await gateway.onModuleInit();

      const mockRedisMessage = {
        chatId: 'test-room',
        message: {
          id: 'msg-123',
          chatId: 'test-room',
          userId: 'user-1',
          username: 'testuser',
      displayName: 'testuser',
          content: 'Hello from Redis',
          sequence: 1,
          createdAt: '2025-10-26T10:00:00.000Z',
        },
      };

      // Simulate Redis message
      redisCallback(mockRedisMessage);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('message', mockRedisMessage.message);
    });
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Client connected: test-socket-id');
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockClient);

      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected: test-socket-id');
      
      consoleSpy.mockRestore();
    });

    it('should clean up user socket mappings', () => {
      // First, join a chat to add to the map
      gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      // Now disconnect
      gateway.handleDisconnect(mockClient);

      // Verify cleanup happened (no errors thrown)
      expect(() => gateway.handleDisconnect(mockClient)).not.toThrow();
    });
  });

  describe('handleJoinChat', () => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        chatId: 'test-room',
        userId: 'user-1',
        username: 'user1',
      displayName: 'user1',
        content: 'First message',
        sequence: 1,
        createdAt: new Date('2025-10-26T10:00:00Z'),
      },
      {
        id: 'msg-2',
        chatId: 'test-room',
        userId: 'user-2',
        username: 'user2',
      displayName: 'user2',
        content: 'Second message',
        sequence: 2,
        createdAt: new Date('2025-10-26T10:01:00Z'),
      },
    ];

    beforeEach(() => {
      messagesService.getMessages.mockResolvedValue(mockMessages);
    });

    it('should join the socket to the specified room', async () => {
      await gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      expect(mockClient.join).toHaveBeenCalledWith('test-room');
    });

    it('should notify other users in the room', async () => {
      await gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      expect(mockClient.to).toHaveBeenCalledWith('test-room');
      expect(mockClient.emit).toHaveBeenCalledWith('user-joined', {
        userId: 'user-123',
        chatId: 'test-room',
      });
    });

    it('should fetch and send chat history to the user', async () => {
      await gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 0);
      expect(mockClient.emit).toHaveBeenCalledWith('chat-history', mockMessages);
    });

    it('should track user socket in the map', async () => {
      // First join
      await gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      // Create a second socket with different ID
      const mockClient2 = {
        ...mockClient,
        id: 'socket-2',
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      } as any;

      // Join again with same user, different socket
      await gateway.handleJoinChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient2
      );

      // Each socket should join once
      expect(mockClient.join).toHaveBeenCalledTimes(1);
      expect(mockClient2.join).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleLeaveChat', () => {
    it('should remove socket from the room', () => {
      gateway.handleLeaveChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      expect(mockClient.leave).toHaveBeenCalledWith('test-room');
    });

    it('should notify other users in the room', () => {
      gateway.handleLeaveChat(
        { chatId: 'test-room', userId: 'user-123' },
        mockClient
      );

      expect(mockClient.to).toHaveBeenCalledWith('test-room');
      expect(mockClient.emit).toHaveBeenCalledWith('user-left', {
        userId: 'user-123',
        chatId: 'test-room',
      });
    });
  });

  describe('handleSendMessage', () => {
    const mockDto: SendMessageDto = {
      chatId: 'test-room',
      userId: 'user-123',
      username: 'testuser',
      displayName: 'testuser',
      content: 'Hello World',
    };

    const mockSavedMessage: Message = {
      id: 'msg-123',
      chatId: 'test-room',
      userId: 'user-123',
      username: 'testuser',
      displayName: 'testuser',
      content: 'Hello World',
      sequence: 1,
      createdAt: new Date('2025-10-26T10:00:00Z'),
    };

    beforeEach(() => {
      messagesService.createMessage.mockResolvedValue(mockSavedMessage);
    });

    it('should create message via MessagesService', async () => {
      await gateway.handleSendMessage(mockDto, mockClient);

      expect(messagesService.createMessage).toHaveBeenCalledWith(mockDto);
    });

    it('should not directly publish to Redis (service handles it)', async () => {
      await gateway.handleSendMessage(mockDto, mockClient);

      // Gateway should NOT call redisService.publish
      // The service does it instead
      expect(redisService.publish).not.toHaveBeenCalled();
    });

    it('should handle message creation errors gracefully', async () => {
      messagesService.createMessage.mockRejectedValue(new Error('DB error'));

      await expect(
        gateway.handleSendMessage(mockDto, mockClient)
      ).rejects.toThrow('DB error');
    });
  });

  describe('handleLoadMoreMessages', () => {
    const mockOlderMessages: Message[] = [
      {
        id: 'msg-old-1',
        chatId: 'test-room',
        userId: 'user-1',
        username: 'user1',
      displayName: 'user1',
        content: 'Old message 1',
        sequence: 1,
        createdAt: new Date('2025-10-25T10:00:00Z'),
      },
      {
        id: 'msg-old-2',
        chatId: 'test-room',
        userId: 'user-2',
        username: 'user2',
      displayName: 'user2',
        content: 'Old message 2',
        sequence: 2,
        createdAt: new Date('2025-10-25T10:01:00Z'),
      },
    ];

    beforeEach(() => {
      messagesService.getMessages.mockResolvedValue(mockOlderMessages);
    });

    it('should fetch older messages with correct pagination', async () => {
      await gateway.handleLoadMoreMessages(
        { chatId: 'test-room', offset: 50 },
        mockClient
      );

      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 50);
    });

    it('should emit chat-history with older messages', async () => {
      await gateway.handleLoadMoreMessages(
        { chatId: 'test-room', offset: 50 },
        mockClient
      );

      expect(mockClient.emit).toHaveBeenCalledWith('chat-history', mockOlderMessages);
    });

    it('should support different offset values', async () => {
      await gateway.handleLoadMoreMessages(
        { chatId: 'test-room', offset: 100 },
        mockClient
      );

      expect(messagesService.getMessages).toHaveBeenCalledWith('test-room', 50, 100);
    });
  });

  describe('Redis Integration', () => {
    it('should wait for Redis to be ready before subscribing', async () => {
      jest.useFakeTimers();
      
      const subscribePromise = gateway.onModuleInit();
      
      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      await subscribePromise;
      
      expect(redisService.subscribe).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle Redis subscription errors gracefully', async () => {
      redisService.subscribe.mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      await expect(gateway.onModuleInit()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast to correct chat room via Redis', async () => {
      let redisCallback: Function;
      
      redisService.subscribe.mockImplementation((channel, callback) => {
        redisCallback = callback;
      });

      await gateway.onModuleInit();

      const message1 = {
        chatId: 'room-1',
        message: {
          id: '1',
          chatId: 'room-1',
          userId: 'user-1',
          username: 'user1',
      displayName: 'user1',
          content: 'Message for room 1',
          sequence: 1,
          createdAt: '2025-10-26T10:00:00.000Z',
        },
      };

      const message2 = {
        chatId: 'room-2',
        message: {
          id: '2',
          chatId: 'room-2',
          userId: 'user-2',
          username: 'user2',
      displayName: 'user2',
          content: 'Message for room 2',
          sequence: 2,
          createdAt: '2025-10-26T10:01:00.000Z',
        },
      };

      redisCallback(message1);
      redisCallback(message2);

      expect(mockServer.to).toHaveBeenCalledWith('room-1');
      expect(mockServer.to).toHaveBeenCalledWith('room-2');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenNthCalledWith(1, 'message', message1.message);
      expect(mockServer.emit).toHaveBeenNthCalledWith(2, 'message', message2.message);
    });
  });
});