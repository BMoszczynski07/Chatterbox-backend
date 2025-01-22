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
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    UserModule,
    UsersModule,
    MessagesModule,
    ProfilePicModule,
    GatewayModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        //! Only for development
        tls: {
          rejectUnauthorized: false,
        },
        //! delete when switching to production
      },
      defaults: {
        from: `"No-Reply" <${process.env.SMTP_USER}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        options: {
          strict: true,
        },
      },
    }),
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
      {
        path: '/api/v1.0.0/users/find-contact/:friend_id',
        method: RequestMethod.GET,
      },
      {
        path: '/api/v1.0.0/user/delete',
        method: RequestMethod.DELETE,
      },
    );
  }
}
