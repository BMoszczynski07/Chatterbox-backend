import { OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserService } from 'src/user/user.service';

@WebSocketGateway(3000, {
  cors: { origin: process.env.CORS_ORIGIN },
})
export class EventsGateway implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

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
}
