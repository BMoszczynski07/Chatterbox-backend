import { Module } from '@nestjs/common';
import { ProfilePicController } from './profile-pic.controller';
import { ProfilePicService } from './profile-pic.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [ProfilePicController],
  providers: [ProfilePicService, PrismaService],
})
export class ProfilePicModule {}
