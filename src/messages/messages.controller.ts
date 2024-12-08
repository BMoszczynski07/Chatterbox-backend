import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('/api/v1.0.0/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('/get-conversation/:conversation_id')
  @HttpCode(HttpStatus.OK)
  async getConversation(
    @Req() req: Request,
    @Param('conversation_id') conversationId: string,
  ) {
    try {
      const decodedToken = req['user'];

      const parsedConversationId = parseInt(conversationId);

      const conversation = await this.messagesService.getConversation(
        decodedToken,
        parsedConversationId,
      );

      return conversation;
    } catch (err) {
      throw err;
    }
  }

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

  @Get('/get-messages/:conversation_id')
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Req() req: Request,
    @Param('conversation_id') conversationId: string,
  ) {
    try {
      const decodedToken = req['user'];
      const conversationIdParsed = parseInt(conversationId, 10);

      const messages = await this.messagesService.getMessages(
        decodedToken,
        conversationIdParsed,
      );

      return messages;
    } catch (err) {
      throw err;
    }
  }
}
