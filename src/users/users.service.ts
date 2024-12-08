import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findContact(friendId: number, decodedToken: { unique_id: string }) {
    // Szukamy użytkownika na podstawie tokenu
    const findUser = await this.prisma.users.findFirst({
      where: { unique_id: decodedToken.unique_id },
    });

    if (!findUser) {
      throw new NotFoundException('User not found.');
    }

    // Szukamy konwersacji, w której uczestniczą zarówno friendId, jak i findUser.id
    const conversation = await this.prisma.conversationParticipants.findFirst({
      where: {
        conversationparticipants_conversation: {
          // Filtrujemy konwersację, by uczestniczyli w niej obaj użytkownicy
          ConversationParticipants: {
            every: {
              user_id: { in: [friendId, findUser.id] }, // Sprawdzamy, czy uczestniczą obaj
            },
          },
        },
      },
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
                  not: findUser.id, // Wykluczamy samego użytkownika
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
            // Pobieramy ostatnią wiadomość
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
                messageViews: {
                  where: {
                    user_id: findUser.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  async createContact(user_id: number, decodedToken: { unique_id: string }) {
    const userFound = await this.prisma.users.findFirst({
      where: { unique_id: decodedToken.unique_id },
    });

    if (!userFound) {
      throw new NotFoundException('User not found.');
    }

    const newContact = await this.prisma.conversations.create({
      data: {
        title: null,
        is_group: false,
        group_pic: null,
        description: null,
      },
    });

    const { id } = newContact;

    const newConversationParticipant1 =
      await this.prisma.conversationParticipants.create({
        data: {
          conversation_id: id,
          user_id: userFound.id,
        },
      });

    const newConversationParticipant2 =
      await this.prisma.conversationParticipants.create({
        data: {
          conversation_id: id,
          user_id,
        },
      });

    const findContact = await this.prisma.conversationParticipants.findFirst({
      where: { user_id: userFound.id, conversation_id: id },
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
                  not: userFound.id,
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
                    user_id: userFound.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    return findContact;
  }

  async getContacts(search: string) {
    if (!search || search.trim() === '') {
      throw new Error('Search query cannot be empty.');
    }

    const searchQuery = search.trim();

    const contacts = await this.prisma.$queryRaw`
      SELECT id, first_name, last_name, email, profile_pic, user_desc
      FROM users
      WHERE CONCAT(first_name, ' ', last_name) LIKE ${`%${searchQuery}%`}
      OR email LIKE ${`%${searchQuery}%`}
    `;

    return contacts;
  }
}
