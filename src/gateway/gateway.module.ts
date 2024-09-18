import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [EventsGateway, UserService, PrismaService],
})
export class GatewayModule {}
