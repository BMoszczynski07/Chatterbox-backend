import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { ConversationAuthMiddleware } from './middleware/conversation-auth.middleware';
import { MessagesModule } from './messages/messages.module';
import { JwtMiddleware } from './jwt/jwt.middleware';

@Module({
  imports: [UserModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ConversationAuthMiddleware).forRoutes({
      path: 'api/v1.0.0/get-messages/:conversationId',
      method: RequestMethod.GET,
    });

    consumer.apply(JwtMiddleware).forRoutes({
      path: '/api/v1.0.0/user/get',
      method: RequestMethod.GET,
    });
  }
}
