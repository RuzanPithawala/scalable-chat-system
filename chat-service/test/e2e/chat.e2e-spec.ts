import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as SocketIOClient from 'socket.io-client';
import { AppModule } from '../../src/app.module';

describe('Chat E2E - WebSocket Connection Test', () => {
  let app: INestApplication;

  const SOCKET_URL = 'http://localhost:3010';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3010);

    // Give the app time to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }, 60000);

  afterAll(async () => {
    // Give time for connections to close
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (app) {
      await app.close();
    }
    
    // Force exit after cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  it('should connect to WebSocket server', (done) => {
    const client = SocketIOClient.connect(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false, // Disable reconnection
    });

    client.on('connect', () => {
      console.log('✅ Successfully connected to WebSocket server');
      expect(client.connected).toBe(true);
      
      // Disconnect immediately after test
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      client.disconnect();
      done(error);
    });
  }, 30000);

  it('should join a chat room and receive chat history', (done) => {
    const client = SocketIOClient.connect(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    client.on('connect', () => {
      console.log('✅ Connected, joining chat room...');
      
      client.emit('join-chat', {
        chatId: 'test-room',
        userId: 'test-user',
      });
    });

    client.on('chat-history', (messages) => {
      console.log(`✅ Received chat history with ${messages.length} messages`);
      expect(Array.isArray(messages)).toBe(true);
      
      // Disconnect after receiving history
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      client.disconnect();
      done(error);
    });
  }, 30000);

  it('should send and receive a message', (done) => {
    let sender: typeof SocketIOClient.Socket;
    let receiver: typeof SocketIOClient.Socket;
    let senderJoined = false;
    let receiverJoined = false;

    sender = SocketIOClient.connect(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    receiver = SocketIOClient.connect(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    sender.on('connect', () => {
      console.log('✅ Sender connected');
      sender.emit('join-chat', {
        chatId: 'e2e-test-room',
        userId: 'sender',
      });
    });

    sender.on('chat-history', () => {
      console.log('✅ Sender joined room');
      senderJoined = true;
      tryToSendMessage();
    });

    receiver.on('connect', () => {
      console.log('✅ Receiver connected');
      receiver.emit('join-chat', {
        chatId: 'e2e-test-room',
        userId: 'receiver',
      });
    });

    receiver.on('chat-history', () => {
      console.log('✅ Receiver joined room');
      receiverJoined = true;
      tryToSendMessage();
    });

    receiver.on('message', (message) => {
      console.log('✅ Receiver got message:', message.content);
      expect(message.content).toBe('E2E test message');
      expect(message.userId).toBe('sender');
      expect(message.sequence).toBeGreaterThan(0);
      
      // Clean disconnect
      setTimeout(() => {
        sender.disconnect();
        receiver.disconnect();
        done();
      }, 100);
    });

    function tryToSendMessage() {
      if (senderJoined && receiverJoined) {
        console.log('🚀 Both joined, sending message...');
        setTimeout(() => {
          sender.emit('send-message', {
            chatId: 'e2e-test-room',
            userId: 'sender',
            username: 'Test Sender',
            displayName: 'Test Sender',
            content: 'E2E test message',
          });
        }, 500);
      }
    }

    sender.on('connect_error', (error) => {
      sender.disconnect();
      receiver.disconnect();
      done(error);
    });

    receiver.on('connect_error', (error) => {
      sender.disconnect();
      receiver.disconnect();
      done(error);
    });
  }, 30000);
});