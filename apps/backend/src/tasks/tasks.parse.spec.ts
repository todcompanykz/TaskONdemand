import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskUrgency } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TasksService } from './tasks.service';
import { TaskStateTransitionService } from './task-state-transition.service';
import { RateLimitService } from './services/rate-limit.service';
import { TelegramNotificationsService } from '../notifications/telegram-notifications.service';
import { OpenAiService } from '../ai/openai.service';

describe('TasksService parseTaskDraft', () => {
  let service: TasksService;
  let openAiService: jest.Mocked<OpenAiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {} as jest.Mocked<Repository<Task>>,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {} as jest.Mocked<Repository<User>>,
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: TaskStateTransitionService,
          useValue: {},
        },
        {
          provide: RateLimitService,
          useValue: {},
        },
        {
          provide: TelegramNotificationsService,
          useValue: {},
        },
        {
          provide: OpenAiService,
          useValue: {
            parseTaskFromFreeTextWithMeta: jest.fn(),
            parseTaskFallbackFromText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    openAiService = module.get(OpenAiService);
  });

  it('returns AI draft when parsing succeeds', async () => {
    openAiService.parseTaskFromFreeTextWithMeta.mockResolvedValue({
      source: 'ai_provider',
      provider: 'openrouter',
      draft: {
        shortDescription: 'Забрать посылку',
        fullDescription: 'Нужно забрать посылку из пункта выдачи',
        city: 'Астана',
        address: 'ул. Туран 10',
        urgency: TaskUrgency.MEDIUM,
        needsUserClarification: false,
        missingFields: [],
        canSubmit: true,
      },
    });

    const result = await service.parseTaskDraft('забрать посылку', 'user-1');

    expect(result.shortDescription).toBe('Забрать посылку');
    expect(result.needsUserClarification).toBe(false);
    expect(result.canSubmit).toBe(true);
  });

  it('returns fallback draft when AI parser fails', async () => {
    openAiService.parseTaskFromFreeTextWithMeta.mockRejectedValue(
      new Error('timeout'),
    );
    openAiService.parseTaskFallbackFromText.mockReturnValue({
      shortDescription: 'Новая задача',
      fullDescription: 'Нужно починить дверь',
      city: 'Астана',
      address: 'Требуется уточнение',
      urgency: TaskUrgency.MEDIUM,
      needsUserClarification: true,
      clarificationQuestion:
        'Пожалуйста, дополните вручную: адрес, время, награду.',
      missingFields: ['address', 'time', 'reward'],
      canSubmit: false,
    });

    const result = await service.parseTaskDraft(
      'Нужно починить дверь',
      'user-1',
    );

    expect(result.city).toBe('Астана');
    expect(result.needsUserClarification).toBe(true);
    expect(result.address).toBe('Требуется уточнение');
    expect(result.canSubmit).toBe(false);
  });
});
