import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Query('chatId') chatId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Message[]> {
    return this.messagesService.getMessages(
      chatId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  async getMessageCount(@Query('chatId') chatId: string): Promise<{ count: number }> {
    const count = await this.messagesService.getMessageCount(chatId);
    return { count };
  }
}