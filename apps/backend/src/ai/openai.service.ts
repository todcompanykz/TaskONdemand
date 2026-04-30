import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskUrgency } from '../tasks/entities/task.entity';

export type ParsedTaskDraft = {
  shortDescription: string;
  fullDescription: string;
  city: string;
  address: string;
  urgency: TaskUrgency;
  rewardSuggestion?: number;
  needsUserClarification: boolean;
  clarificationQuestion?: string;
  missingFields: string[];
  canSubmit: boolean;
  rewriteQualityNote?: string;
};

export type AiParseSource = 'ai_provider' | 'fallback_local';
export type AiErrorCategory =
  | 'no_api_key'
  | 'provider_http_error'
  | 'invalid_json_response'
  | 'timeout'
  | 'network_error';

export type ParseTaskWithMetaResult = {
  draft: ParsedTaskDraft;
  source: AiParseSource;
  provider: string;
  errorCategory?: AiErrorCategory;
  errorMessage?: string;
};

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly taskParseSystemInstruction =
    'Extract a task draft from user text. Return JSON only with keys: shortDescription, fullDescription, city, address, urgency, rewardSuggestion, needsUserClarification, clarificationQuestion. urgency must be one of: low, medium, high. Always rewrite text clearly and professionally. shortDescription must be concise (up to 70-90 chars), and must NOT include address, time, or reward amount. fullDescription can be detailed and must keep all facts from input: address, time, reward, conditions. Never copy input text verbatim.';

  constructor(private readonly configService: ConfigService) {}

  parseTaskFallbackFromText(freeText: string): ParsedTaskDraft {
    return this.normalizeParsedDraft({}, freeText);
  }

  async parseTaskFromFreeText(freeText: string): Promise<ParsedTaskDraft> {
    const result = await this.parseTaskFromFreeTextWithMeta(freeText);
    return result.draft;
  }

  async parseTaskFromFreeTextWithMeta(
    freeText: string,
  ): Promise<ParseTaskWithMetaResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const defaultBaseUrl = 'https://openrouter.ai/api/v1';
    const baseUrl =
      this.configService.get<string>('OPENAI_BASE_URL') || defaultBaseUrl;
    const provider = this.resolveProviderName(baseUrl);

    if (!apiKey) {
      this.logger.warn({
        event: 'task_parse_ai_unavailable',
        provider,
        errorCategory: 'no_api_key',
        fallback: 'local_fallback',
      });
      return {
        draft: this.parseTaskFallbackFromText(freeText),
        source: 'fallback_local',
        provider,
        errorCategory: 'no_api_key',
        errorMessage: 'OPENAI_API_KEY is not configured',
      };
    }

    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const timeoutMs = Number(
      this.configService.get<string>('OPENAI_TIMEOUT_MS') || '12000',
    );
    const openRouterReferer = this.configService.get<string>(
      'OPENROUTER_HTTP_REFERER',
    );
    const openRouterTitle =
      this.configService.get<string>('OPENROUTER_X_TITLE');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      if (provider === 'openrouter') {
        if (openRouterReferer) headers['HTTP-Referer'] = openRouterReferer;
        if (openRouterTitle) headers['X-Title'] = openRouterTitle;
      }

      const runRequest = async (
        messages: Array<{ role: 'system' | 'user'; content: string }>,
      ) =>
        fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model,
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages,
          }),
        });

      let response = await runRequest([
        {
          role: 'system',
          content: this.taskParseSystemInstruction,
        },
        {
          role: 'user',
          content: freeText,
        },
      ]);

      if (!response.ok) {
        let errorBody = await response.text();
        const shouldRetryWithoutSystemPrompt =
          response.status === 400 &&
          /Developer instruction is not enabled/i.test(errorBody);
        if (shouldRetryWithoutSystemPrompt) {
          response = await runRequest([
            {
              role: 'user',
              content: `${this.taskParseSystemInstruction}\n\nUser text:\n${freeText}`,
            },
          ]);
          if (response.ok) {
            const data = await response.json();
            const rawContent = data?.choices?.[0]?.message?.content;
            if (typeof rawContent !== 'string' || !rawContent.trim()) {
              throw new Error('OpenAI response does not contain JSON content');
            }

            const parsed = this.parseProviderJson(rawContent);
            return {
              draft: this.normalizeParsedDraft(parsed, freeText),
              source: 'ai_provider',
              provider,
            };
          }
          errorBody = await response.text();
        }
        throw new Error(
          `OpenAI request failed with status ${response.status}: ${errorBody}`,
        );
      }

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      if (typeof rawContent !== 'string' || !rawContent.trim()) {
        throw new Error('OpenAI response does not contain JSON content');
      }

      const parsed = this.parseProviderJson(rawContent);
      return {
        draft: this.normalizeParsedDraft(parsed, freeText),
        source: 'ai_provider',
        provider,
      };
    } catch (error) {
      const { category, message } = this.categorizeAiError(error);
      this.logger.warn({
        event: 'task_parse_ai_failed',
        provider,
        model,
        errorCategory: category,
        errorMessage: message,
        fallback: 'local_fallback',
      });
      return {
        draft: this.parseTaskFallbackFromText(freeText),
        source: 'fallback_local',
        provider,
        errorCategory: category,
        errorMessage: message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveProviderName(baseUrl: string): string {
    const normalized = baseUrl.toLowerCase();
    if (normalized.includes('openrouter.ai')) return 'openrouter';
    if (normalized.includes('api.openai.com')) return 'openai';
    return 'custom';
  }

  private parseProviderJson(rawContent: string): any {
    try {
      return JSON.parse(rawContent);
    } catch {
      const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const candidate = fencedMatch?.[1] || this.extractJsonObject(rawContent);
      if (candidate) {
        return JSON.parse(candidate);
      }

      const loose = this.parseLooseStructuredContent(rawContent);
      if (loose) {
        return loose;
      }

      throw new Error('OpenAI response does not contain JSON content');
    }
  }

  private extractJsonObject(text: string): string | undefined {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return undefined;
    }
    return text.slice(start, end + 1).trim();
  }

  private parseLooseStructuredContent(rawContent: string): any | undefined {
    const normalized = rawContent.replace(/\r/g, '').trim();
    if (!normalized) {
      return undefined;
    }

    const pickField = (labels: string[]) => {
      for (const label of labels) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
          `(?:^|\\n)\\s*(?:${escaped})\\s*[:\\-]\\s*(.+?)(?=\\n\\s*[\\p{L}\\p{N}_\\- ]{2,40}\\s*[:\\-]|$)`,
          'iu',
        );
        const match = normalized.match(regex);
        if (match?.[1]) {
          return match[1].trim();
        }
      }
      return undefined;
    };

    const shortDescription =
      pickField([
        'shortDescription',
        'short_description',
        'краткое описание',
      ]) ||
      normalized
        .split('\n')
        .find((line) => line.trim())
        ?.trim();
    const fullDescription =
      pickField([
        'fullDescription',
        'full_description',
        'описание',
        'детали',
      ]) || normalized;
    const city = pickField(['city', 'город']);
    const address = pickField(['address', 'адрес']);
    const urgency = pickField(['urgency', 'priority', 'срочность']);
    const rewardRaw = pickField([
      'rewardSuggestion',
      'reward',
      'вознаграждение',
      'оплата',
    ]);
    const rewardSuggestion = rewardRaw
      ? Number((rewardRaw.match(/\d{2,7}/) || [])[0])
      : undefined;

    return {
      shortDescription,
      fullDescription,
      city,
      address,
      urgency,
      rewardSuggestion,
    };
  }

  private categorizeAiError(error: unknown): {
    category: AiErrorCategory;
    message: string;
  } {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { category: 'timeout', message };
    }
    if (/status\s+\d{3}/i.test(message)) {
      return { category: 'provider_http_error', message };
    }
    if (/JSON/i.test(message)) {
      return { category: 'invalid_json_response', message };
    }
    return { category: 'network_error', message };
  }

  private normalizeParsedDraft(input: any, freeText: string): ParsedTaskDraft {
    const extractedAddress = this.extractAddress(freeText);
    const extractedTime = this.extractTime(freeText);
    const extractedReward = this.extractRewardSuggestion(freeText);

    const urgency = this.normalizeUrgency(input?.urgency);
    const baseShortDescription = this.normalizeText(
      input?.shortDescription,
      this.buildFallbackShortDescription(freeText),
      100,
    );
    const baseFullDescription = this.normalizeText(
      input?.fullDescription,
      freeText.trim(),
    );
    const fullDescription = extractedTime
      ? this.appendTimeToDescription(baseFullDescription, extractedTime)
      : baseFullDescription;
    const shortDescription = this.buildPolishedShortDescription(
      baseShortDescription,
      freeText,
      fullDescription,
    );

    const city = this.normalizeText(input?.city, 'Астана', 100);
    const rawModelAddress = this.normalizeOptionalText(input?.address, 200);
    const normalizedModelAddress = rawModelAddress
      ? this.sanitizeAddressCandidate(rawModelAddress)
      : undefined;
    const hasPlaceholderModelAddress = this.isAddressPlaceholder(
      normalizedModelAddress,
    );
    const address = hasPlaceholderModelAddress
      ? extractedAddress || 'Требуется уточнение'
      : this.normalizeText(
          normalizedModelAddress,
          extractedAddress || 'Требуется уточнение',
          200,
        );

    const rawReward = Number(input?.rewardSuggestion);
    const modelRewardSuggestion =
      Number.isFinite(rawReward) && rawReward >= 5
        ? Math.floor(rawReward / 5) * 5
        : undefined;
    const rewardSuggestion = extractedReward ?? modelRewardSuggestion;

    const clarificationQuestion = this.normalizeOptionalText(
      input?.clarificationQuestion,
      200,
    );

    const hasConcreteAddress = !this.isAddressPlaceholder(address);
    const hasConcreteTime =
      Boolean(extractedTime) ||
      /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.test(fullDescription);
    const hasRewardSuggestion =
      typeof rewardSuggestion === 'number' && Number.isFinite(rewardSuggestion);
    const missingFields = this.collectMissingFields({
      hasConcreteAddress,
      hasConcreteTime,
      hasRewardSuggestion,
      shortDescription,
      fullDescription,
    });
    const needsUserClarification = missingFields.length > 0;
    const generatedClarification = this.buildClarificationQuestion({
      hasConcreteAddress,
      hasConcreteTime,
      hasRewardSuggestion,
    });

    return {
      shortDescription,
      fullDescription,
      city,
      address,
      urgency,
      rewardSuggestion,
      needsUserClarification,
      clarificationQuestion: needsUserClarification
        ? clarificationQuestion || generatedClarification
        : undefined,
      missingFields,
      canSubmit: missingFields.length === 0,
      rewriteQualityNote:
        shortDescription !== baseShortDescription ||
        fullDescription !== baseFullDescription
          ? 'Текст переформулирован с сохранением фактов.'
          : undefined,
    };
  }

  private normalizeUrgency(raw: unknown): TaskUrgency {
    if (
      raw === TaskUrgency.LOW ||
      raw === TaskUrgency.MEDIUM ||
      raw === TaskUrgency.HIGH
    ) {
      return raw;
    }

    return TaskUrgency.MEDIUM;
  }

  private normalizeText(
    value: unknown,
    fallback: string,
    maxLength?: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      return maxLength ? fallback.slice(0, maxLength) : fallback;
    }

    const normalized = value.trim();
    return maxLength ? normalized.slice(0, maxLength) : normalized;
  }

  private normalizeOptionalText(
    value: unknown,
    maxLength?: number,
  ): string | undefined {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }

    const normalized = value.trim();
    return maxLength ? normalized.slice(0, maxLength) : normalized;
  }

  private buildFallbackShortDescription(freeText: string): string {
    const base = freeText.trim().replace(/\s+/g, ' ');
    if (!base) {
      return 'Новая задача';
    }
    return base.slice(0, 100);
  }

  private extractAddress(freeText: string): string | undefined {
    const normalized = freeText.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return undefined;
    }

    const addressKeywordMatch = normalized.match(
      /(?:адрес|по адресу)\s*[:\-]?\s*(.+?)(?=(?:\s+(?:время|срок|когда)\b)|$)/i,
    );
    if (addressKeywordMatch?.[1]) {
      return this.sanitizeAddressCandidate(addressKeywordMatch[1]);
    }

    // Infer address only if common street/address markers are present.
    const streetLikeMatch = normalized.match(
      /((?:г\.\s*)?[А-ЯA-Z][^,]{1,40},?\s*(?:ул\.?|улица|пр\.?|просп\.?|проспект|мкр\.?|микрорайон)\s*[^,]{1,120}(?:,\s*\d+[а-яa-z0-9\-\/]*)?)/i,
    );
    if (streetLikeMatch?.[1]) {
      return this.sanitizeAddressCandidate(streetLikeMatch[1]);
    }

    return undefined;
  }

  private extractTime(freeText: string): string | undefined {
    const normalized = freeText.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return undefined;
    }

    const timeKeywordMatch = normalized.match(
      /(?:время|когда|к\s*)\s*[:\-]?\s*([01]?\d|2[0-3])[:.]([0-5]\d)/i,
    );
    if (timeKeywordMatch) {
      return `${timeKeywordMatch[1]}:${timeKeywordMatch[2]}`;
    }

    const bareTimeMatch = normalized.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
    if (bareTimeMatch) {
      return `${bareTimeMatch[1]}:${bareTimeMatch[2]}`;
    }

    return undefined;
  }

  private appendTimeToDescription(description: string, time: string): string {
    const alreadyContainsTime = new RegExp(
      `\\b${time.replace(':', '[:.]')}\\b`,
      'i',
    ).test(description);
    if (alreadyContainsTime) {
      return description;
    }

    return `${description} Удобное время: ${time}.`.trim();
  }

  private extractRewardSuggestion(freeText: string): number | undefined {
    const normalized = freeText.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    // Examples: "5000", "5000 тг", "5000 тенге", "5000 даю", "за 5000"
    const candidates = normalized.match(/\d{2,7}/g) || [];
    let parsed: number | undefined;

    for (const value of candidates) {
      const index = normalized.indexOf(value);
      const tail = normalized.slice(
        index + value.length,
        index + value.length + 16,
      );
      const head = normalized.slice(Math.max(0, index - 10), index);

      const hasRewardContext =
        /(тг|тенге|kzt|₸|даю|оплачу|вознаграждение)/i.test(tail) ||
        /(за\s*)$/i.test(head);

      if (hasRewardContext) {
        parsed = Number(value);
        break;
      }
    }

    if (parsed === undefined && candidates.length > 0) {
      // Fallback: use the first reasonably large number as reward.
      parsed = Number(candidates.find((n) => Number(n) >= 500));
    }

    if (!Number.isFinite(parsed) || parsed < 5) {
      return undefined;
    }

    return Math.floor(parsed / 5) * 5;
  }

  private buildClarificationQuestion(args: {
    hasConcreteAddress: boolean;
    hasConcreteTime: boolean;
    hasRewardSuggestion: boolean;
  }): string {
    const missing: string[] = [];
    if (!args.hasConcreteAddress) missing.push('адрес');
    if (!args.hasConcreteTime) missing.push('время');
    if (!args.hasRewardSuggestion) missing.push('награду');

    if (missing.length === 0) {
      return 'Проверьте данные и при необходимости скорректируйте вручную.';
    }

    return `Пожалуйста, дополните вручную: ${missing.join(', ')}.`;
  }

  private collectMissingFields(args: {
    hasConcreteAddress: boolean;
    hasConcreteTime: boolean;
    hasRewardSuggestion: boolean;
    shortDescription: string;
    fullDescription: string;
  }): string[] {
    const missing: string[] = [];
    if (!args.shortDescription?.trim()) missing.push('shortDescription');
    if (!args.fullDescription?.trim()) missing.push('fullDescription');
    if (!args.hasConcreteAddress) missing.push('address');
    if (!args.hasConcreteTime) missing.push('time');
    if (!args.hasRewardSuggestion) missing.push('reward');
    return missing;
  }

  private buildPolishedShortDescription(
    currentShortDescription: string,
    freeText: string,
    fullDescription: string,
  ): string {
    const candidate = currentShortDescription.trim();
    if (!candidate) {
      return this.buildIntentShortDescription(freeText, fullDescription);
    }

    const normalized = candidate
      .replace(/\b(адрес|время)\b.*$/i, '')
      .replace(/\b\d{2,7}\s*(?:тг|тенге|kzt|₸)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const tooSimilarToInput = this.areTextsTooSimilar(normalized, freeText);
    const hasFactNoise = /\b(?:ул\.?|улица|пр\.?|проспект|время)\b/i.test(
      normalized,
    );

    if (!normalized || tooSimilarToInput || hasFactNoise) {
      return this.buildIntentShortDescription(freeText, fullDescription);
    }

    const capitalized =
      normalized.charAt(0).toUpperCase() + normalized.slice(1);
    return capitalized.slice(0, 90);
  }

  private buildIntentShortDescription(
    freeText: string,
    fallbackSource: string,
  ): string {
    const normalized = freeText.replace(/\s+/g, ' ').trim();
    const source = normalized || fallbackSource;

    const patterns: Array<{ regex: RegExp; title: string }> = [
      {
        regex: /\bснег|почистить|уборка снега\b/i,
        title: 'Очистка снега у дома',
      },
      {
        regex: /\bкран|сантех|труба|протечк\b/i,
        title: 'Сантехническая помощь',
      },
      {
        regex: /\bдостав|посылк|перевезти|отвезти\b/i,
        title: 'Доставка и перевозка',
      },
      {
        regex: /\bэлектрик|провод|розетк|свет\b/i,
        title: 'Электромонтажные работы',
      },
      { regex: /\bуборк|чистк|помыть\b/i, title: 'Клининговая помощь' },
      { regex: /\bремонт|починить|исправить\b/i, title: 'Бытовой ремонт' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(source)) {
        return pattern.title;
      }
    }

    return this.buildFallbackShortDescription(source).slice(0, 90);
  }

  private areTextsTooSimilar(a: string, b: string): boolean {
    const na = this.normalizeForSimilarity(a);
    const nb = this.normalizeForSimilarity(b);
    if (!na || !nb) {
      return false;
    }

    if (na === nb) {
      return true;
    }

    if (na.length >= 25 && nb.includes(na)) {
      return true;
    }

    const aTokens = new Set(na.split(' ').filter(Boolean));
    const bTokens = new Set(nb.split(' ').filter(Boolean));
    let intersection = 0;
    aTokens.forEach((token) => {
      if (bTokens.has(token)) intersection++;
    });

    const overlap =
      intersection / Math.max(1, Math.min(aTokens.size, bTokens.size));
    return overlap >= 0.8 && aTokens.size >= 4;
  }

  private normalizeForSimilarity(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isAddressPlaceholder(value: string | undefined): boolean {
    if (!value) {
      return true;
    }

    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'требуется уточнение' ||
      normalized === 'нужно уточнить' ||
      normalized === 'уточнить' ||
      normalized.includes('уточните адрес')
    );
  }

  private sanitizeAddressCandidate(value: string): string {
    return value
      .replace(/\s+(?:время|срок|когда)\s*:?.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }
}
