import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { RedisService } from '../redis/redis.service';
import type { SendMessageDto } from './dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private messagesService: MessagesService,
    private redisService: RedisService,
  ) {}

  async onModuleInit() {
    // Wait a bit to ensure Redis connections are fully ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Subscribe to Redis channel AFTER all modules are initialized
    this.redisService.subscribe('chat-messages', (message) => {
      // Broadcast message received from Redis to all connected clients
      this.server.to(message.message.chatId).emit('message', message.message);
    });

    console.log('WebSocket Gateway initialized and subscribed to Redis');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Clean up user socket mappings
    for (const [userId, sockets] of this.userSockets.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    // Join the Socket.IO room
    client.join(chatId);

    // Track user's socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);

    console.log(`User ${userId} joined chat ${chatId}`);

    // Notify others in the room
    client.to(chatId).emit('user-joined', { userId, chatId });

    // Send chat history to the newly joined user
    const messages = await this.messagesService.getMessages(chatId, 50, 0);
    client.emit('chat-history', messages);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, userId } = data;

    client.leave(chatId);
    console.log(`User ${userId} left chat ${chatId}`);

    // Notify others in the room
    client.to(chatId).emit('user-left', { userId, chatId });
  }

  @SubscribeMessage('send-message')
async handleSendMessage(
  @MessageBody() data: SendMessageDto,
  @ConnectedSocket() client: Socket,
) {
  // Service handles publishing to Redis with correct format
  await this.messagesService.createMessage(data);
}

  @SubscribeMessage('load-more-messages')
  async handleLoadMoreMessages(
    @MessageBody() data: { chatId: string; offset: number },
    @ConnectedSocket() client: Socket,
  ) {
    const messages = await this.messagesService.getMessages(
      data.chatId,
      50,
      data.offset,
    );
    client.emit('chat-history', messages);
  }
}