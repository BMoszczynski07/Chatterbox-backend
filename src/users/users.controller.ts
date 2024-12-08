import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('/api/v1.0.0/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/find-contact/:friend_id')
  @HttpCode(HttpStatus.OK)
  async findContact(@Req() req: Request, @Param('friend_id') friendId: string) {
    try {
      const decodedToken = req['user'];

      return await this.usersService.findContact(
        parseInt(friendId),
        decodedToken,
      );
    } catch (err) {
      throw err;
    }
  }

  @Get('/get-contacts/:searchParam')
  @HttpCode(HttpStatus.OK)
  async getFriends(@Param('searchParam') searchParam: string) {
    try {
      return await this.usersService.getContacts(searchParam);
    } catch (err) {
      throw err;
    }
  }

  @Post('/create-contact/:user_id')
  @HttpCode(HttpStatus.CREATED)
  async createContact(@Req() req: Request, @Param('user_id') userId: string) {
    try {
      const decodedToken = req['user'];

      return await this.usersService.createContact(
        parseInt(userId),
        decodedToken,
      );
    } catch (err) {
      throw err;
    }
  }
}
