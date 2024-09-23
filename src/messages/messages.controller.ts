import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Messages } from '@prisma/client';
import { MessagesService } from './messages.service';

@Controller('/api/v1.0.0/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('/get-conversations')
  @HttpCode(HttpStatus.OK)
  async getConversations(@Req() req: Request) {
    try {
      const decodedToken = req['user'];

      const messages =
        await this.messagesService.getConversations(decodedToken);

      return messages;
    } catch (err) {
      throw err;
    }
  }
}
