import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { TasksController } from '../src/tasks/tasks.controller';
import { TasksService } from '../src/tasks/tasks.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ClaimBlockGuard } from '../src/tasks/guards/claim-block.guard';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-e2e-1' };
    return true;
  }
}

describe('TasksController (e2e) /tasks/parse', () => {
  let app: INestApplication;
  const parseTaskDraftMock = jest.fn();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            parseTaskDraft: parseTaskDraftMock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(ClaimBlockGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    parseTaskDraftMock.mockReset();
  });

  it('returns parsed draft for valid free text', async () => {
    parseTaskDraftMock.mockResolvedValue({
      shortDescription: 'Починить кран',
      fullDescription: 'Нужно починить кран на кухне',
      city: 'Астана',
      address: 'пр. Туран 1',
      urgency: 'medium',
      rewardSuggestion: 1500,
      needsUserClarification: false,
    });

    const response = await request(app.getHttpServer())
      .post('/tasks/parse')
      .send({ freeText: 'сломался кран на кухне' })
      .expect(201);

    expect(parseTaskDraftMock).toHaveBeenCalledWith(
      'сломался кран на кухне',
      'user-e2e-1',
    );
    expect(response.body).toEqual(
      expect.objectContaining({
        shortDescription: 'Починить кран',
        needsUserClarification: false,
      }),
    );
  });

  it('returns 400 when freeText is invalid', async () => {
    await request(app.getHttpServer())
      .post('/tasks/parse')
      .send({ freeText: 'abc' })
      .expect(400);

    expect(parseTaskDraftMock).not.toHaveBeenCalled();
  });
});
