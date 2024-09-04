import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Users } from '@prisma/client';
import UserLoginDTO from './classes/UserLoginDTO';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  getUsers(@Body() userLoginDto: UserLoginDTO): Promise<Users> {
    try {
      return this.appService.login(userLoginDto);
    } catch (err) {
      throw err;
    }
  }
}
