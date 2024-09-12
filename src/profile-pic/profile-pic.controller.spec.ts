import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePicController } from './profile-pic.controller';

describe('ProfilePicController', () => {
  let controller: ProfilePicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilePicController],
    }).compile();

    controller = module.get<ProfilePicController>(ProfilePicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
