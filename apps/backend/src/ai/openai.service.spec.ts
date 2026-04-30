import { ConfigService } from '@nestjs/config';
import { OpenAiService } from './openai.service';

describe('OpenAiService', () => {
  let service: OpenAiService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-key';
        if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
        if (key === 'OPENAI_BASE_URL') return 'https://api.openai.com/v1';
        if (key === 'OPENAI_TIMEOUT_MS') return '1000';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new OpenAiService(configService);
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('uses local fallback parser when API key is not configured', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'OPENAI_API_KEY') return undefined;
      return undefined;
    });

    const result = await service.parseTaskFromFreeText(
      'Снег почистить 5000 даю Адрес г. Алматы, ул. Примерная, 123 Время 18:00',
    );

    expect(result.address).toContain('г. Алматы');
    expect(result.rewardSuggestion).toBe(5000);
    expect(result.needsUserClarification).toBe(false);
    expect(result.canSubmit).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('normalizes valid model response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                shortDescription: 'Починить кран',
                fullDescription: 'Нужно заменить прокладку в кухне',
                city: 'Астана',
                address: 'пр. Мангилик Ел 1',
                urgency: 'high',
                rewardSuggestion: 1234,
                needsUserClarification: false,
              }),
            },
          },
        ],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText('сломался кран');

    expect(result.shortDescription).toBe('Починить кран');
    expect(result.urgency).toBe('high');
    expect(result.rewardSuggestion).toBe(1230);
    expect(result.needsUserClarification).toBe(true);
    expect(result.canSubmit).toBe(false);
    expect(result.missingFields).toContain('time');
  });

  it('uses OpenRouter base URL by default when OPENAI_BASE_URL is empty', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-key';
      if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
      if (key === 'OPENAI_BASE_URL') return undefined;
      if (key === 'OPENAI_TIMEOUT_MS') return '1000';
      return undefined;
    });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: JSON.stringify({ shortDescription: 'Тест' }) },
          },
        ],
      }),
    });
    (global as any).fetch = fetchMock;

    await service.parseTaskFromFreeText('test');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://openrouter.ai/api/v1/chat/completions'),
      expect.any(Object),
    );
  });

  it('falls back to local parser when provider returns an error', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeTextWithMeta(
      'Снег почистить 5000 даю Адрес г. Алматы, ул. Примерная, 123 Время 18:00',
    );

    expect(result.source).toBe('fallback_local');
    expect(result.provider).toBe('openai');
    expect(result.errorCategory).toBe('provider_http_error');
    expect(result.draft.canSubmit).toBe(true);
  });

  it('uses defaults when model returns partial data', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({}) } }],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText(
      'Нужна помощь с доставкой',
    );

    expect(result.city).toBe('Астана');
    expect(result.address).toBe('Требуется уточнение');
    expect(result.needsUserClarification).toBe(true);
    expect(result.clarificationQuestion).toBeDefined();
    expect(result.canSubmit).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['address', 'time', 'reward']),
    );
  });

  it('extracts explicit address and time from user text', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({}) } }],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText(
      'Снег почистить перед домом 5000 тг Адрес г. Алматы, ул. Примерная, 123 Время 18:00',
    );

    expect(result.shortDescription).not.toContain('Алматы');
    expect(result.shortDescription).not.toContain('5000');
    expect(result.address).toContain('г. Алматы');
    expect(result.fullDescription).toContain('18:00');
    expect(result.rewardSuggestion).toBe(5000);
    expect(result.needsUserClarification).toBe(false);
    expect(result.canSubmit).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('overrides placeholder model address with extracted user address and time', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                shortDescription: 'Почистить снег',
                fullDescription: 'Снег почистить перед домом',
                city: 'Алматы',
                address: 'Требуется уточнение',
                urgency: 'medium',
                needsUserClarification: true,
                clarificationQuestion: 'Уточните адрес',
              }),
            },
          },
        ],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText(
      'Снег почистить перед домом 5000 даю Адрес г. Алматы, ул. Примерная, 123 Время 18:00',
    );

    expect(result.address).toContain('г. Алматы');
    expect(result.fullDescription).toContain('18:00');
    expect(result.rewardSuggestion).toBe(5000);
    expect(result.shortDescription).not.toContain('Алматы');
    expect(result.shortDescription).not.toContain('5000');
    expect(result.needsUserClarification).toBe(false);
    expect(result.clarificationQuestion).toBeUndefined();
    expect(result.canSubmit).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('rebuilds short description when model copies user text', async () => {
    const sourceText =
      'Снег почистить перед домом 5000 даю Адрес г. Алматы, ул. Примерная, 123 Время 18:00';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                shortDescription: sourceText,
                fullDescription: sourceText,
                address: 'г. Алматы, ул. Примерная, 123',
                urgency: 'medium',
              }),
            },
          },
        ],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText(sourceText);

    expect(result.shortDescription).toBe('Очистка снега у дома');
    expect(result.fullDescription).toContain('18:00');
    expect(result.shortDescription).not.toContain('5000');
    expect(result.shortDescription).not.toContain('Алматы');
  });

  it('asks user to fill missing fields manually', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({}) } }],
      }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.parseTaskFromFreeText('Нужно почистить снег');

    expect(result.needsUserClarification).toBe(true);
    expect(result.clarificationQuestion).toContain('дополните вручную');
    expect(result.canSubmit).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['address', 'time', 'reward']),
    );
  });
});
