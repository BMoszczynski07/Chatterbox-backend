import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(
    decodedToken: { unique_id: string },
    conversationId: number,
  ) {
    // Pobierz `user_id` na podstawie `unique_id` z tokenu
    const user = await this.prisma.users.findUnique({
      where: { unique_id: decodedToken.unique_id },
      select: { id: true },
    });

    if (!user) {
      throw new Error('Unauthorized');
    }

    const isParticipant = await this.prisma.conversationParticipants.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: user.id,
      },
    });

    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Pobierz wiadomości dla tej konwersacji
    const messages = await this.prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { message_date: 'asc' },
    });

    return messages;
  }

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
              where: {
                user_id: {
                  not: getUserId.id,
                },
              },
              select: {
                conversationparticipants_user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    profile_pic: true,
                    unique_id: true,
                    create_date: true,
                  },
                },
              },
            },
            // Pobierz ostatnią wiadomość
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
                    unique_id: true,
                  },
                },
                // Dodanie pola, które sprawdza, czy wiadomość została widziana
                messageViews: {
                  where: {
                    user_id: getUserId.id,
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
