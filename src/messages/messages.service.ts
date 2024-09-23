import { Injectable } from '@nestjs/common';
import { Messages } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(decodedToken: { unique_id: string }) {
    const getUserId = await this.prisma.users.findFirst({
      where: { unique_id: decodedToken.unique_id },
      select: { id: true },
    });

    const conversations = await this.prisma.conversationParticipants.findMany({
      where: { user_id: getUserId.id },
      select: {
        conversationparticipants_conversation: {
          select: {
            id: true,
            title: true,
            is_group: true,
            group_pic: true,
            description: true,
            ConversationParticipants: {
              select: {
                conversationparticipants_user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    profile_pic: true,
                  },
                },
              },
            },
            Messages: {
              orderBy: {
                message_date: 'desc',
              },
              take: 1,
              select: {
                id: true,
                content: true,
                message_date: true,
                messages_user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return conversations;
  }
}
