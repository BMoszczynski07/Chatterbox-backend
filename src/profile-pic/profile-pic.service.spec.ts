import { Test, TestingModule } from '@nestjs/testing';
import { ProfilePicService } from './profile-pic.service';

describe('ProfilePicService', () => {
  let service: ProfilePicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilePicService],
    }).compile();

    service = module.get<ProfilePicService>(ProfilePicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
