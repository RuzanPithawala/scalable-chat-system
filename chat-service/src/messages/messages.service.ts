import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/message.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private redisService: RedisService,
  ) {}

  async createMessage(data: SendMessageDto): Promise<Message> {
    console.log('🚀 CREATE MESSAGE CALLED:', JSON.stringify(data));
    
    const sequenceKey = `chat:${data.chatId}:sequence`;
    const sequence = await this.redisService.getPublisher().incr(sequenceKey);
    
    console.log(`🔢 Creating message in ${data.chatId} with sequence: ${sequence}`);

    const message = this.messagesRepository.create({
      chatId: data.chatId,
      userId: data.userId,
      username: data.username,
      content: data.content,
      sequence,
    });

    const savedMessage = await this.messagesRepository.save(message);
    
    console.log(`✅ Message saved with sequence: ${savedMessage.sequence}`);

    // Publish to Redis for other instances with ISO date
  const publishData = {
    chatId: data.chatId,
    message: {
      ...savedMessage,
      createdAt: savedMessage.createdAt.toISOString(),
    },
  };

  console.log('📤 Publishing:', JSON.stringify(publishData));

  await this.redisService.publish('chat-messages', publishData);

    return savedMessage;
  }

  async getMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const totalCount = await this.messagesRepository.count({
      where: { chatId },
    });

    console.log(`Getting messages for ${chatId}: total=${totalCount}, limit=${limit}, offset=${offset}`);

    if (offset === 0) {
      const messages = await this.messagesRepository.find({
        where: { chatId },
        order: { 
          sequence: 'DESC',
          createdAt: 'DESC',
        },
        take: limit,
      });
      
      const result = messages.reverse();
      return result;
    } else {
      const messages = await this.messagesRepository.find({
        where: { chatId },
        order: { 
          sequence: 'DESC',
          createdAt: 'DESC',
        },
        take: limit,
        skip: offset,
      });
      
      const result = messages.reverse();
      return result;
    }
  }

  async getMessageCount(chatId: string): Promise<number> {
    return this.messagesRepository.count({
      where: { chatId },
    });
  }
}