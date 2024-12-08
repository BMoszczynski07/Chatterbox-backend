import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { ConversationAuthMiddleware } from './middleware/conversation-auth.middleware';
import { MessagesModule } from './messages/messages.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { ProfilePicModule } from './profile-pic/profile-pic.module';
import { GatewayModule } from './gateway/gateway.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UserModule,
    UsersModule,
    MessagesModule,
    ProfilePicModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ConversationAuthMiddleware).forRoutes({
      path: 'api/v1.0.0/get-messages/:conversationId',
      method: RequestMethod.GET,
    });

    consumer.apply(JwtMiddleware).forRoutes(
      {
        path: '/api/v1.0.0/user/get',
        method: RequestMethod.GET,
      },
      {
        path: '/api/v1.0.0/profile-pic/img',
        method: RequestMethod.POST,
      },
      {
        path: '/api/v1.0.0/user/update',
        method: RequestMethod.PATCH,
      },
      {
        path: '/api/v1.0.0/user/change-pass',
        method: RequestMethod.PATCH,
      },
      {
        path: '/api/v1.0.0/user/update-socket-id/:socketId',
        method: RequestMethod.PATCH,
      },
      {
        path: '/api/v1.0.0/user/unset-active',
        method: RequestMethod.PATCH,
      },
      {
        path: '/api/v1.0.0/messages/get-conversations',
        method: RequestMethod.GET,
      },
      {
        path: '/api/v1.0.0/messages/get-messages/:conversation_id',
        method: RequestMethod.GET,
      },
      {
        path: '/api/v1.0.0/messages/get-conversation/:conversation_id',
        method: RequestMethod.GET,
      },
      {
        path: '/api/v1.0.0/users/create-contact/:user_id',
        method: RequestMethod.POST,
      },
    );
  }
}
