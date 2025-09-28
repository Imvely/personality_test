import type { NextApiRequest, NextApiResponse } from 'next';
import { imageGenerator, ImageQualityFilter, GeneratedImage } from '@/utils/imageGeneration';
import { Archetype } from '@/types';

interface RequestBody {
  archetype: Archetype;
  imageType?: 'avatar' | 'og' | 'story' | 'all';
  style?: 'cute' | 'sophisticated';
}

interface ApiResponse {
  success: boolean;
  data?: GeneratedImage | GeneratedImage[];
  error?: string;
  cached?: boolean;
}

const imageCache = new Map<string, { images: GeneratedImage[]; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

function getCacheKey(archetype: Archetype, imageType: string, style: string): string {
  return `${archetype.id}-${imageType}-${style}`;
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
    const {
      archetype,
      imageType = 'all',
      style = 'cute'
    }: RequestBody = req.body;

    if (!archetype) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: archetype'
      });
    }

    const cacheKey = getCacheKey(archetype, imageType, style);
    const cached = imageCache.get(cacheKey);

    if (cached && isValidCache(cached.timestamp)) {
      const result = imageType === 'all' ? cached.images : cached.images.find(img => img.type === imageType);
      return res.status(200).json({
        success: true,
        data: result,
        cached: true
      });
    }

    let result: GeneratedImage | GeneratedImage[];

    if (imageType === 'all') {
      // 모든 타입의 이미지 생성
      result = await imageGenerator.generateAllImages(archetype);

      // 생성된 이미지들의 품질 검증
      for (const image of result) {
        const validation = await ImageQualityFilter.validateImageQuality(image.url, image.type);

        if (!validation.isValid) {
          console.error(`Image quality validation failed for ${image.type}:`, validation.errors);
          // 실패한 이미지는 기본 이미지로 대체
          image.url = `/default-${archetype.id}-${image.type}.jpg`;
        }

        // 부적절한 콘텐츠 검사
        const isAppropriate = await ImageQualityFilter.checkForInappropriateContent(image.url);
        if (!isAppropriate) {
          console.error(`Inappropriate content detected for ${image.type}`);
          image.url = `/default-${archetype.id}-${image.type}.jpg`;
        }
      }

      // 캐시에 저장
      imageCache.set(cacheKey, {
        images: result,
        timestamp: Date.now()
      });

    } else {
      // 특정 타입의 이미지만 생성
      const size = imageType === 'avatar' ? '1024x1024' as const :
                   imageType === 'og' ? '1792x1024' as const :
                   '1024x1792' as const;

      result = await imageGenerator.generateImage(archetype, {
        type: imageType,
        style: style as 'cute' | 'sophisticated',
        size
      });

      // 품질 검증
      const validation = await ImageQualityFilter.validateImageQuality(result.url, result.type);
      if (!validation.isValid) {
        console.error(`Image quality validation failed:`, validation.errors);
        result.url = `/default-${archetype.id}-${result.type}.jpg`;
      }

      // 부적절한 콘텐츠 검사
      const isAppropriate = await ImageQualityFilter.checkForInappropriateContent(result.url);
      if (!isAppropriate) {
        console.error(`Inappropriate content detected`);
        result.url = `/default-${archetype.id}-${result.type}.jpg`;
      }

      // 단일 이미지도 배열 형태로 캐시에 저장
      imageCache.set(cacheKey, {
        images: [result],
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      cached: false
    });

  } catch (error) {
    console.error('Image generation error:', error);

    // 에러 발생 시 기본 이미지들 반환
    const fallbackImages: GeneratedImage[] = [
      {
        url: `/default-${req.body.archetype?.id || 'generic'}-avatar.jpg`,
        prompt: 'fallback default image',
        type: 'avatar',
        archetype: req.body.archetype?.id || 'generic'
      },
      {
        url: `/default-${req.body.archetype?.id || 'generic'}-og.jpg`,
        prompt: 'fallback default image',
        type: 'og',
        archetype: req.body.archetype?.id || 'generic'
      },
      {
        url: `/default-${req.body.archetype?.id || 'generic'}-story.jpg`,
        prompt: 'fallback default image',
        type: 'story',
        archetype: req.body.archetype?.id || 'generic'
      }
    ];

    const imageType = req.body.imageType || 'all';
    const result = imageType === 'all' ?
      fallbackImages :
      fallbackImages.find(img => img.type === imageType);

    res.status(200).json({
      success: true,
      data: result,
      error: 'Used fallback images due to generation failure'
    });
  }
}

// 캐시 정리 함수 (선택적으로 cron job으로 실행)
export function cleanupImageCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  imageCache.forEach((value, key) => {
    if (!isValidCache(value.timestamp)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => {
    imageCache.delete(key);
  });

  console.log(`Cleaned up ${keysToDelete.length} expired image cache entries`);
}

export { imageCache };