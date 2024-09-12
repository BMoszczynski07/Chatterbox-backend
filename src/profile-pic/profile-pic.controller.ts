import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfilePicService } from './profile-pic.service';

@Controller('api/v1.0.0/profile-pic')
export class ProfilePicController {
  constructor(private readonly profilePicService: ProfilePicService) {}

  @Post('img')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './static',
        filename: (req, file, cb) => {
          const name = file.originalname.split('.')[0];
          const fileExtName = extname(file.originalname);
          const dateNow = Date.now();
          const randomString = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          cb(null, `${name}-${dateNow}-${randomString}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB limit
    }),
  )
  async uploadSingleFile(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const decodedToken = req['user'];

      // Change profile picture
      return await this.profilePicService.updateProfilePicture(
        decodedToken,
        `${file.filename}`,
      );
    } catch (err) {
      throw err;
    }
  }
}
