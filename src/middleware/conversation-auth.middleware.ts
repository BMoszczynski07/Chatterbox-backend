import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConversationAuthMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header('authorization');

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    const userId = decoded.unique_id;
    const { conversationId } = req.params;

    const { id } = await this.prisma.users.findFirst({
      where: {
        unique_id: userId,
      },
    });

    const participant = await this.prisma.conversationParticipants.findFirst({
      where: {
        conversation_id: Number(conversationId),
        user_id: id,
      },
    });

    if (!participant) {
      throw new UnauthorizedException(
        'You do not have an access to this conversation.',
      );
    }

    req['conversation'] = await this.prisma.conversations.findUnique({
      where: { id: Number(conversationId) },
    });

    next();
  }
}
