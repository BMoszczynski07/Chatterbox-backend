import { Controller, Get, Param } from '@nestjs/common';
import { Messages } from '@prisma/client';
import { MessagesService } from './messages.service';

@Controller('/api/v1.0.0/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('/get-messages/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
  ): Promise<Messages[]> {
    const messages = await this.messagesService.getMessages(conversationId);

    return messages;
  }
}
