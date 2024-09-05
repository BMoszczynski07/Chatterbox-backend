import { Injectable } from '@nestjs/common';
import { Messages } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  getMessages(conversationId: string): Promise<Messages[]> {
    const messages = this.prisma.messages.findMany({
      where: { conversation_id: Number(conversationId) },
      orderBy: { message_date: 'asc' },
    });

    return messages;
  }
}
