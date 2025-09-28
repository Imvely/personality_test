import { Archetype } from '@/types';
import { abTestManager } from './analytics';

export interface ImageGenerationOptions {
  type: 'avatar' | 'og' | 'story';
  style: 'cute' | 'sophisticated';
  size: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  type: 'avatar' | 'og' | 'story';
  archetype: string;
}

export class ImageGenerator {
  private static instance: ImageGenerator;

  private constructor() {}

  public static getInstance(): ImageGenerator {
    if (!ImageGenerator.instance) {
      ImageGenerator.instance = new ImageGenerator();
    }
    return ImageGenerator.instance;
  }

  private getBaseStyle(style: 'cute' | 'sophisticated'): string {
    if (style === 'cute') {
      return `cute, kawaii, soft colors, round shapes, friendly expression, warm lighting,
              pastel color palette, gentle shadows, smooth gradients, adorable, charming,
              cartoonish but detailed, high quality digital illustration`;
    } else {
      return `sophisticated, elegant, modern, minimalist, clean lines, professional,
              balanced composition, refined color palette, subtle gradients,
              premium quality, stylish, contemporary art style, polished finish`;
    }
  }

  private createAvatarPrompt(archetype: Archetype, style: 'cute' | 'sophisticated'): string {
    const baseStyle = this.getBaseStyle(style);
    const characterElement = this.getCharacterElement(archetype.id);

    return `A ${style} anthropomorphic ${characterElement} character avatar, ${baseStyle},
            ${this.getArchetypeSpecificStyle(archetype, style)},
            profile picture style, centered composition, solid background,
            no text, no watermarks, no human faces, digital art, trending on artstation`;
  }

  private createOGPrompt(archetype: Archetype, style: 'cute' | 'sophisticated'): string {
    const baseStyle = this.getBaseStyle(style);
    const characterElement = this.getCharacterElement(archetype.id);

    return `Social media banner featuring ${characterElement} theme, ${baseStyle},
            ${this.getArchetypeSpecificStyle(archetype, style)},
            horizontal composition 16:9 ratio, space for text overlay,
            Instagram and Facebook friendly, no text, no watermarks,
            eye-catching design, professional social media graphics`;
  }

  private createStoryPrompt(archetype: Archetype, style: 'cute' | 'sophisticated'): string {
    const baseStyle = this.getBaseStyle(style);
    const characterElement = this.getCharacterElement(archetype.id);

    return `Vertical story format image featuring ${characterElement}, ${baseStyle},
            ${this.getArchetypeSpecificStyle(archetype, style)},
            9:16 aspect ratio, mobile-friendly design, Instagram story optimized,
            engaging visual narrative, no text, no watermarks,
            designed for social media sharing`;
  }

  private getCharacterElement(archetypeId: string): string {
    const characterMap: { [key: string]: string } = {
      coffee_cat: 'cat with coffee elements, cozy café atmosphere',
      urban_fox: 'fox in urban setting, city lights and modern architecture',
      adventure_rabbit: 'rabbit with adventure gear, mountain or outdoor scenery',
      iron_bear: 'strong bear, forest or mountain landscape',
      pixie_butterfly: 'magical butterfly, enchanted garden with flowers',
      sharp_wolf: 'wolf in professional setting, sleek and modern environment',
      sweet_penguin: 'penguin family scene, warm and caring atmosphere',
      hipster_bear: 'stylish bear with vintage items, coffee shop or bookstore setting'
    };

    return characterMap[archetypeId] || 'animal character';
  }

  private getArchetypeSpecificStyle(archetype: Archetype, style: 'cute' | 'sophisticated'): string {
    const { primary, secondary, accent } = archetype.colors;

    const colorScheme = `color palette featuring ${primary}, ${secondary}, and ${accent}`;

    const styleMap: { [key: string]: { cute: string; sophisticated: string } } = {
      coffee_cat: {
        cute: 'warm browns and creams, steaming coffee cup, cozy sweater, soft cushions',
        sophisticated: 'rich coffee tones, minimalist café design, elegant pottery, clean lines'
      },
      urban_fox: {
        cute: 'vibrant city colors, friendly streetlights, colorful buildings, playful urban elements',
        sophisticated: 'sleek cityscape, modern architecture, professional business district, metallic accents'
      },
      adventure_rabbit: {
        cute: 'bright outdoor colors, cheerful hiking gear, sunny mountain views, energetic pose',
        sophisticated: 'dramatic landscape photography style, premium outdoor equipment, majestic scenery'
      },
      iron_bear: {
        cute: 'earthy forest tones, friendly campfire, cozy cabin elements, warm and safe feeling',
        sophisticated: 'strong natural materials, elegant wilderness lodge, refined outdoor aesthetic'
      },
      pixie_butterfly: {
        cute: 'magical sparkles, rainbow colors, flower petals, whimsical fairy tale elements',
        sophisticated: 'ethereal lighting, artistic flower arrangements, elegant botanical design'
      },
      sharp_wolf: {
        cute: 'cool professional colors, friendly office environment, approachable business setting',
        sophisticated: 'executive style, premium materials, sharp business aesthetic, confident posture'
      },
      sweet_penguin: {
        cute: 'soft pastels, family gathering, warm hugs, comfortable home environment',
        sophisticated: 'elegant family portrait style, refined home design, caring gestures'
      },
      hipster_bear: {
        cute: 'vintage café items, colorful books, quirky accessories, artistic workspace',
        sophisticated: 'curated vintage aesthetic, premium artisanal items, sophisticated creative space'
      }
    };

    const archetypeStyle = styleMap[archetype.id]?.[style] || 'general animal character design';
    return `${colorScheme}, ${archetypeStyle}`;
  }

  private getSizeForType(type: 'avatar' | 'og' | 'story'): '1024x1024' | '1792x1024' | '1024x1792' {
    switch (type) {
      case 'avatar':
        return '1024x1024';
      case 'og':
        return '1792x1024';
      case 'story':
        return '1024x1792';
      default:
        return '1024x1024';
    }
  }

  public async generateImage(
    archetype: Archetype,
    options: ImageGenerationOptions
  ): Promise<GeneratedImage> {
    try {
      console.log('🖼️ 이미지 생성 (로컬 파일 모드):', archetype.id, options.type);

      // 로컬 이미지 파일 경로 생성
      const stylePrefix = options.style === 'sophisticated' ? 'soph' : 'cute';
      const imagePath = `/images/${options.type}s/${archetype.id}-${stylePrefix}.jpg`;

      return {
        url: imagePath,
        prompt: `로컬 파일: ${imagePath}`,
        type: options.type,
        archetype: archetype.id
      };

    } catch (error) {
      console.error('Image generation failed:', error);
      // 폴백: 기본 플레이스홀더 이미지
      return {
        url: `/images/placeholder-${options.type}.jpg`,
        prompt: 'fallback placeholder image',
        type: options.type,
        archetype: archetype.id
      };
    }
  }

  public async generateAllImages(archetype: Archetype): Promise<GeneratedImage[]> {
    const variant = abTestManager.getUserVariant();
    const style = variant.config.imageStyle || 'cute';

    const imageTypes: Array<{
      type: 'avatar' | 'og' | 'story';
      size: '1024x1024' | '1792x1024' | '1024x1792';
    }> = [
      { type: 'avatar', size: '1024x1024' },
      { type: 'og', size: '1792x1024' },
      { type: 'story', size: '1024x1792' }
    ];

    console.log('🖼️ 모든 이미지 생성 (로컬 파일 모드):', archetype.id, style);

    try {
      const results = imageTypes.map(({ type, size }) => {
        const stylePrefix = style === 'sophisticated' ? 'soph' : 'cute';
        const imagePath = `/images/${type}s/${archetype.id}-${stylePrefix}.jpg`;

        return {
          url: imagePath,
          prompt: `로컬 파일: ${imagePath}`,
          type,
          archetype: archetype.id
        };
      });

      return results;
    } catch (error) {
      console.error('Failed to generate all images:', error);
      // 실패 시 플레이스홀더 이미지 반환
      return imageTypes.map(({ type }) => ({
        url: `/images/placeholder-${type}.jpg`,
        prompt: 'fallback placeholder image',
        type,
        archetype: archetype.id
      }));
    }
  }
}

export class ImageProcessor {
  public static async downloadAndCache(imageUrl: string, filename: string): Promise<string> {
    try {
      // 실제 환경에서는 이미지를 다운로드하고 CDN에 업로드
      // 현재는 원본 URL 반환
      return imageUrl;
    } catch (error) {
      console.error('Image download failed:', error);
      return imageUrl;
    }
  }

  public static async addTextOverlay(
    imageUrl: string,
    text: string,
    options: {
      fontSize: number;
      fontColor: string;
      position: 'top' | 'center' | 'bottom';
      backgroundColor?: string;
    }
  ): Promise<string> {
    try {
      // 실제 환경에서는 Canvas API나 Sharp 라이브러리를 사용하여 텍스트 오버레이 추가
      // 현재는 원본 이미지 URL 반환
      console.log('Text overlay would be added:', { text, options });
      return imageUrl;
    } catch (error) {
      console.error('Text overlay failed:', error);
      return imageUrl;
    }
  }

  public static generateOGMetaTags(image: GeneratedImage, archetype: Archetype): string {
    return `
    <meta property="og:title" content="나는 ${archetype.name}!" />
    <meta property="og:description" content="${archetype.hook}" />
    <meta property="og:image" content="${image.url}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="나는 ${archetype.name}!" />
    <meta name="twitter:description" content="${archetype.hook}" />
    <meta name="twitter:image" content="${image.url}" />
    `;
  }
}

export class ImageQualityFilter {
  private static minDimensions = {
    avatar: { width: 400, height: 400 },
    og: { width: 1200, height: 630 },
    story: { width: 720, height: 1280 }
  };

  public static async validateImageQuality(
    imageUrl: string,
    type: 'avatar' | 'og' | 'story'
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 실제 환경에서는 이미지를 다운로드하고 분석
      // 현재는 기본 검증만 수행

      if (!imageUrl || !imageUrl.startsWith('http')) {
        errors.push('Invalid image URL');
      }

      // 추가 품질 검사 로직
      // - 이미지 해상도 확인
      // - 파일 크기 확인
      // - 부적절한 내용 필터링

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Image validation failed:', error);
      return {
        isValid: false,
        errors: ['Image validation failed']
      };
    }
  }

  public static async checkForInappropriateContent(imageUrl: string): Promise<boolean> {
    try {
      // 실제 환경에서는 AI 기반 이미지 콘텐츠 분석 서비스 사용
      // 예: Google Cloud Vision API, Amazon Rekognition 등

      // 현재는 항상 적절한 콘텐츠로 간주
      return true;
    } catch (error) {
      console.error('Content check failed:', error);
      return false;
    }
  }
}

export const imageGenerator = ImageGenerator.getInstance();