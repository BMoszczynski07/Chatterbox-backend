import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader === `Bearer ${null}` || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('No token provided!');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      req['user'] = decoded;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    next();
  }
}
