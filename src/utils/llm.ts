import { Archetype, NormalizedScores, GeneratedContent, LLMPrompt } from '@/types';
import { abTestManager } from './analytics';
import mockContent from '@/data/mockContent.json';

export class LLMGenerator {
  private static instance: LLMGenerator;

  private constructor() {}

  public static getInstance(): LLMGenerator {
    if (!LLMGenerator.instance) {
      LLMGenerator.instance = new LLMGenerator();
    }
    return LLMGenerator.instance;
  }

  private getSystemPrompt(textTone: 'emotional' | 'playful'): string {
    const basePrompt = `당신은 MZ세대를 위한 감성적이고 재미있는 심리테스트 결과를 생성하는 전문가입니다.

성격 특성 해석 가이드:
- 외향성 (extroversion): 70+ = 매우 사교적, 40-69 = 적당히 사교적, 39- = 내향적
- 모험심 (adventure): 70+ = 새로운 것을 추구, 40-69 = 균형잡힌, 39- = 안정 선호
- 안정성 (stability): 70+ = 예측가능성 중시, 40-69 = 유연한, 39- = 변화 추구
- 공감능력 (empathy): 70+ = 높은 감수성, 40-69 = 적절한 공감, 39- = 논리적 사고
- 창의성 (creativity): 70+ = 독창적, 40-69 = 실용적 창의, 39- = 현실적

글쓰기 스타일:
- 친근하고 따뜻한 톤
- MZ세대 언어와 감성 활용
- 구체적이고 공감가능한 표현
- 긍정적이면서도 현실적인 관점
- 이모지 적절히 활용`;

    if (textTone === 'emotional') {
      return basePrompt + `

감성적 톤 (emotional):
- 감정에 깊이 공감하는 표현
- "마음이", "느낌이", "감정적으로" 등의 감성 어휘 활용
- 위로와 격려의 메시지 포함
- 내면의 아름다움과 가치 강조`;
    } else {
      return basePrompt + `

장난스러운 톤 (playful):
- 유머러스하고 재미있는 표현
- "ㅋㅋ", "대박", "완전" 등의 MZ세대 표현 활용
- 친구같은 친근한 말투
- 재미있는 비유와 상황 설정`;
    }
  }

  private createSummaryPrompt(archetype: Archetype, scores: NormalizedScores, textTone: 'emotional' | 'playful'): LLMPrompt {
    return {
      system: this.getSystemPrompt(textTone),
      user: `다음 정보를 바탕으로 2-3문장의 간단하고 감성적인 요약을 생성해주세요:

아키타입: ${archetype.name}
기본 설명: ${archetype.short_summary}
성격 점수:
- 외향성: ${scores.extroversion}%
- 모험심: ${scores.adventure}%
- 안정성: ${scores.stability}%
- 공감능력: ${scores.empathy}%
- 창의성: ${scores.creativity}%

요구사항:
- 2-3문장으로 간결하게
- ${textTone === 'emotional' ? '감성적이고 위로가 되는' : '재미있고 친근한'} 톤
- 가장 높은 특성 1-2개를 중심으로
- SNS에 공유하기 좋은 형태
- 이모지 1-2개 포함`
    };
  }

  private createSNSCaptionPrompt(archetype: Archetype, scores: NormalizedScores, textTone: 'emotional' | 'playful'): LLMPrompt {
    return {
      system: this.getSystemPrompt(textTone),
      user: `다음 정보를 바탕으로 SNS 공유용 캡션을 생성해주세요:

아키타입: ${archetype.name}
기본 설명: ${archetype.short_summary}
성격 점수:
- 외향성: ${scores.extroversion}%
- 모험심: ${scores.adventure}%
- 안정성: ${scores.stability}%
- 공감능력: ${scores.empathy}%
- 창의성: ${scores.creativity}%

요구사항:
- 1-2문장의 임팩트 있는 캐치프레이즈
- ${textTone === 'emotional' ? '감성적이고 공감가는' : '재미있고 바이럴 가능한'} 내용
- 해시태그 3-5개 포함
- 친구들이 궁금해할만한 훅 포함
- 총 150자 이내`
    };
  }

  private createDeepReportPrompt(archetype: Archetype, scores: NormalizedScores, textTone: 'emotional' | 'playful'): LLMPrompt {
    return {
      system: this.getSystemPrompt(textTone),
      user: `다음 정보를 바탕으로 상세한 성격 분석 리포트를 생성해주세요:

아키타입: ${archetype.name}
기본 설명: ${archetype.short_summary}
성격 점수:
- 외향성: ${scores.extroversion}%
- 모험심: ${scores.adventure}%
- 안정성: ${scores.stability}%
- 공감능력: ${scores.empathy}%
- 창의성: ${scores.creativity}%

다음 구조로 800-1500자의 리포트를 작성해주세요:

1. 성격 종합 분석 (200-300자)
   - 5가지 특성의 조합이 만드는 독특한 성격
   - 강점과 매력 포인트

2. 인간관계 스타일 (200-300자)
   - 친구들과의 관계 방식
   - 연애할 때의 특징
   - 갈등 상황에서의 대처법

3. 추천 직업/진로 (200-300자)
   - 성격에 맞는 직업군 3-4개
   - 성공할 수 있는 이유
   - 주의해야 할 점

4. 성장을 위한 조언 (200-300자)
   - 실천 가능한 구체적 팁 3가지
   - 단점을 보완하는 방법
   - 강점을 더 발전시키는 방법

톤: ${textTone === 'emotional' ? '따뜻하고 격려하는' : '친근하고 재미있는'}
이모지 적절히 활용, 문단별로 소제목 포함`
    };
  }

  public async generateSummary(archetype: Archetype, scores: NormalizedScores): Promise<string> {
    try {
      console.log('🤖 LLM 요약 생성 (목업 모드):', archetype.id);

      // 목업 데이터에서 가져오기
      const mockData = (mockContent as any)[archetype.id];
      if (mockData && mockData.summary) {
        return mockData.summary;
      }

      // 폴백: 아키타입 기본 요약
      return archetype.short_summary;
    } catch (error) {
      console.error('Summary generation failed:', error);
      return archetype.short_summary;
    }
  }

  public async generateSNSCaption(archetype: Archetype, scores: NormalizedScores): Promise<string> {
    try {
      console.log('📱 SNS 캡션 생성 (목업 모드):', archetype.id);

      // 목업 데이터에서 가져오기
      const mockData = (mockContent as any)[archetype.id];
      if (mockData && mockData.snsCaption) {
        return mockData.snsCaption;
      }

      // 폴백: 기본 SNS 캡션
      return `나는 ${archetype.name}! ✨ ${archetype.hook} #심리테스트 #${archetype.name} #성격테스트`;
    } catch (error) {
      console.error('SNS caption generation failed:', error);
      return `나는 ${archetype.name}! ✨ ${archetype.hook} #심리테스트 #${archetype.name} #성격테스트`;
    }
  }

  public async generateDeepReport(archetype: Archetype, scores: NormalizedScores): Promise<string> {
    try {
      console.log('📄 심층 리포트 생성 (목업 모드):', archetype.id);

      // 목업 데이터에서 가져오기
      const mockData = (mockContent as any)[archetype.id];
      if (mockData && mockData.deepReport) {
        return mockData.deepReport;
      }

      // 폴백: 아키타입 기본 유료 리포트
      return archetype.paid_report;
    } catch (error) {
      console.error('Deep report generation failed:', error);
      return archetype.paid_report;
    }
  }

  public async generateAllContent(archetype: Archetype, scores: NormalizedScores): Promise<GeneratedContent> {
    const [summary, snsCaption, deepReport] = await Promise.all([
      this.generateSummary(archetype, scores),
      this.generateSNSCaption(archetype, scores),
      this.generateDeepReport(archetype, scores)
    ]);

    return {
      summary,
      snsCaption,
      deepReport
    };
  }
}

export class ContentFilter {
  private static bannedWords = [
    '우울', '자살', '죽음', '질병', '병원', '치료',
    '정치', '종교', '성적', '차별', '혐오',
    '범죄', '불법', '마약', '도박', '폭력'
  ];

  private static sensitiveTopics = [
    '정신건강', '의료진단', '정치성향', '종교관',
    '성적지향', '인종', '장애', '질병진단'
  ];

  public static isContentSafe(content: string): boolean {
    const lowerContent = content.toLowerCase();

    for (const word of this.bannedWords) {
      if (lowerContent.includes(word)) {
        return false;
      }
    }

    for (const topic of this.sensitiveTopics) {
      if (lowerContent.includes(topic)) {
        return false;
      }
    }

    return true;
  }

  public static checkLength(content: string, minLength: number, maxLength: number): boolean {
    return content.length >= minLength && content.length <= maxLength;
  }

  public static checkRepetition(content: string): boolean {
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));

    const repetitionRate = 1 - (uniqueSentences.size / sentences.length);
    return repetitionRate < 0.3;
  }

  public static validateContent(
    content: string,
    type: 'summary' | 'sns' | 'report'
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isContentSafe(content)) {
      errors.push('부적절한 내용이 포함되어 있습니다.');
    }

    if (!this.checkRepetition(content)) {
      errors.push('반복적인 내용이 너무 많습니다.');
    }

    const lengthRules = {
      summary: { min: 50, max: 300 },
      sns: { min: 30, max: 200 },
      report: { min: 500, max: 2000 }
    };

    const rule = lengthRules[type];
    if (!this.checkLength(content, rule.min, rule.max)) {
      errors.push(`내용 길이가 적절하지 않습니다. (${rule.min}-${rule.max}자)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const llmGenerator = LLMGenerator.getInstance();