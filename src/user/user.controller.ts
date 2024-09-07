import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Users } from '@prisma/client';
import UserLoginDTO from 'src/classes/UserLoginDTO';
import { UserService } from './user.service';

@Controller('/api/v1.0.0/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() userLoginDto: UserLoginDTO,
  ): Promise<{ user: Users; token: string }> {
    try {
      return await this.userService.login(userLoginDto);
    } catch (err) {
      throw err;
    }
  }
}
