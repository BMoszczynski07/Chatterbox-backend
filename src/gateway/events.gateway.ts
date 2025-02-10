import { OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@WebSocketGateway(3000, {
  cors: { origin: process.env.CORS_ORIGIN },
})
export class EventsGateway implements OnModuleInit {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    });
  }

  @SubscribeMessage('active-user')
  async handleActiveUser(@MessageBody() userPayload: any) {
    if (userPayload === null) return;

    const friends = await this.userService.getFriends(userPayload);

    for (const friend of friends) {
      this.server.to(friend.socket_id).emit('active-user', userPayload);
    }
  }

  @SubscribeMessage('inactive-user')
  async handleInactiveUser(@MessageBody() userPayload: any) {
    const friends = await this.userService.getFriends(userPayload);

    for (const friend of friends) {
      this.server.to(friend.socket_id).emit('inactive-user', userPayload);
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessageToUser(
    @MessageBody() payload: { uniqueIds: string[]; message: any },
  ) {
    console.log(payload.message.messages[0].conversation_id);

    const savedMessage = await this.prisma.messages.create({
      data: {
        conversation_id: payload.message.messages[0].conversation_id,
        user_id: payload.message.messages[0].user_id,
        message_date: new Date(),
        content: payload.message.messages[0].content,
        type: 'message',
        img_src: payload.message.messages[0].img_src,
        responseTo: payload.message.messages[0].responseTo,
      },
    });

    for (const uniqueId of payload.uniqueIds) {
      const recipient = await this.prisma.users.findUnique({
        where: { unique_id: uniqueId },
      });

      if (!recipient || !recipient.socket_id) {
        console.error('Recipient not found or not connected.');
        return;
      }

      // Emit the message to the recipient's socket
      this.server
        .to(recipient.socket_id)
        .emit('receive-message', payload.message);
    }
  }
}
