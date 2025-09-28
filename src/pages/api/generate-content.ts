import type { NextApiRequest, NextApiResponse } from 'next';
import { llmGenerator, ContentFilter } from '@/utils/llm';
import { Archetype, NormalizedScores, GeneratedContent } from '@/types';

interface RequestBody {
  archetype: Archetype;
  scores: NormalizedScores;
  contentType?: 'summary' | 'sns' | 'report' | 'all';
}

interface ApiResponse {
  success: boolean;
  data?: GeneratedContent | string;
  error?: string;
  cached?: boolean;
}

const contentCache = new Map<string, { content: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

function getCacheKey(archetype: Archetype, scores: NormalizedScores, contentType: string): string {
  const scoresString = Object.values(scores).join('-');
  return `${archetype.id}-${scoresString}-${contentType}`;
}

function isValidCache(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { archetype, scores, contentType = 'all' }: RequestBody = req.body;

    if (!archetype || !scores) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: archetype and scores'
      });
    }

    const cacheKey = getCacheKey(archetype, scores, contentType);
    const cached = contentCache.get(cacheKey);

    if (cached && isValidCache(cached.timestamp)) {
      return res.status(200).json({
        success: true,
        data: cached.content,
        cached: true
      });
    }

    let result: GeneratedContent | string;

    switch (contentType) {
      case 'summary':
        result = await llmGenerator.generateSummary(archetype, scores);
        break;
      case 'sns':
        result = await llmGenerator.generateSNSCaption(archetype, scores);
        break;
      case 'report':
        result = await llmGenerator.generateDeepReport(archetype, scores);
        break;
      case 'all':
      default:
        result = await llmGenerator.generateAllContent(archetype, scores);
        break;
    }

    if (typeof result === 'string') {
      const validation = ContentFilter.validateContent(
        result,
        contentType as 'summary' | 'sns' | 'report'
      );

      if (!validation.isValid) {
        console.error('Content validation failed:', validation.errors);
        return res.status(400).json({
          success: false,
          error: 'Generated content did not pass validation'
        });
      }
    } else {
      for (const [type, content] of Object.entries(result)) {
        const validation = ContentFilter.validateContent(
          content,
          type as 'summary' | 'sns' | 'report'
        );

        if (!validation.isValid) {
          console.error(`Content validation failed for ${type}:`, validation.errors);

          if (type === 'summary') {
            result.summary = archetype.short_summary;
          } else if (type === 'snsCaption') {
            result.snsCaption = `나는 ${archetype.name}! ✨ ${archetype.hook} #심리테스트 #성격테스트`;
          } else if (type === 'deepReport') {
            result.deepReport = archetype.paid_report;
          }
        }
      }
    }

    contentCache.set(cacheKey, {
      content: result,
      timestamp: Date.now()
    });

    res.status(200).json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content'
    });
  }
}

export { contentCache };