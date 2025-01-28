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
    @MessageBody() payload: { uniqueId: string; message: any },
  ) {
    const recipient = await this.prisma.users.findUnique({
      where: { unique_id: payload.uniqueId },
    });

    if (!recipient || !recipient.socket_id) {
      console.error('Recipient not found or not connected.');
      return;
    }

    console.log(payload.message.conversation_id);

    // Save the message to the database
    payload.message.message_date = new Date();

    const savedMessage = await this.prisma.messages.create({
      data: {
        conversation_id: payload.message.conversation_id,
        user_id: payload.message.user_id,
        message_date: new Date(),
        content: payload.message.content,
        type: 'message',
        img_src: payload.message.img_src,
        responseTo: payload.message.responseTo,
      },
    });

    // Emit the message to the recipient's socket
    this.server
      .to(recipient.socket_id)
      .emit('receive-message', payload.message);
  }
}
