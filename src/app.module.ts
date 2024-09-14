import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { ConversationAuthMiddleware } from './middleware/conversation-auth.middleware';
import { MessagesModule } from './messages/messages.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { ProfilePicModule } from './profile-pic/profile-pic.module';

@Module({
  imports: [UserModule, MessagesModule, ProfilePicModule],
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
    );
  }
}
