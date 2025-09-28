import type { NextApiRequest, NextApiResponse } from 'next';
import { llmGenerator } from '@/utils/llm';
import { Archetype, NormalizedScores, GeneratedContent } from '@/types';
import { paymentManager } from '@/utils/payment';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface RequestBody {
  sessionId: string;
  archetype: Archetype;
  scores: NormalizedScores;
}

interface ApiResponse {
  success: boolean;
  content?: GeneratedContent;
  downloadUrl?: string;
  error?: string;
}

interface PremiumContent {
  archetype: Archetype;
  scores: NormalizedScores;
  content: GeneratedContent;
  timestamp: Date;
  sessionId: string;
}

// 메모리 캐시 (실제 환경에서는 데이터베이스 사용 권장)
const premiumContentCache = new Map<string, PremiumContent>();

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
    const { sessionId, archetype, scores }: RequestBody = req.body;

    if (!sessionId || !archetype || !scores) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 결제 검증
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return res.status(403).json({
        success: false,
        error: 'Payment not verified'
      });
    }

    // 이미 생성된 콘텐츠가 있는지 확인
    const cachedContent = premiumContentCache.get(sessionId);
    if (cachedContent) {
      return res.status(200).json({
        success: true,
        content: cachedContent.content,
        downloadUrl: `/api/download-pdf/${sessionId}`
      });
    }

    // 프리미엄 콘텐츠 생성
    const content = await generatePremiumContent(archetype, scores);

    // 생성된 콘텐츠 캐시에 저장
    premiumContentCache.set(sessionId, {
      archetype,
      scores,
      content,
      timestamp: new Date(),
      sessionId
    });

    res.status(200).json({
      success: true,
      content,
      downloadUrl: `/api/download-pdf/${sessionId}`
    });

  } catch (error) {
    console.error('Premium report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate premium report'
    });
  }
}

async function generatePremiumContent(
  archetype: Archetype,
  scores: NormalizedScores
): Promise<GeneratedContent> {
  try {
    // 심층 리포트 생성
    const deepReport = await llmGenerator.generateDeepReport(archetype, scores);

    // 추가 프리미엄 콘텐츠 생성
    const careerRecommendations = await generateCareerRecommendations(archetype, scores);
    const relationshipGuide = await generateRelationshipGuide(archetype, scores);
    const personalizedRecommendations = await generatePersonalizedRecommendations(archetype, scores);

    const enhancedReport = `
${deepReport}

## 💼 맞춤 커리어 가이드
${careerRecommendations}

## 💕 인간관계 스타일 가이드
${relationshipGuide}

## 🎯 개인화된 추천
${personalizedRecommendations}

---
*이 리포트는 AI 기반 분석으로 생성되었으며, 참고용으로만 사용하시기 바랍니다.*
*© MZ 퍼스널 심리테스트 - 모든 권리 보유*
    `.trim();

    // 요약과 SNS 캡션도 프리미엄 버전으로 생성
    const summary = await llmGenerator.generateSummary(archetype, scores);
    const snsCaption = await llmGenerator.generateSNSCaption(archetype, scores);

    return {
      summary,
      snsCaption,
      deepReport: enhancedReport
    };

  } catch (error) {
    console.error('Enhanced content generation failed:', error);
    // 기본 콘텐츠로 폴백
    return await llmGenerator.generateAllContent(archetype, scores);
  }
}

async function generateCareerRecommendations(
  archetype: Archetype,
  scores: NormalizedScores
): Promise<string> {
  // 성격 특성에 따른 맞춤 직업 추천 로직
  const traits = Object.entries(scores);
  const dominantTraits = traits.filter(([_, score]) => score >= 70);
  const lowTraits = traits.filter(([_, score]) => score <= 30);

  let recommendations = `### 추천 직업군\n\n`;

  // 아키타입별 맞춤 직업 추천
  const careerMap: { [key: string]: string[] } = {
    coffee_cat: ['상담사', '심리치료사', '편집자', '도서관 사서', '그래픽 디자이너'],
    urban_fox: ['마케터', 'PR 전문가', '스타트업 창업가', '브랜드 매니저', '컨설턴트'],
    adventure_rabbit: ['여행 가이드', '이벤트 기획자', '스포츠 강사', '방송인', '사진작가'],
    iron_bear: ['프로젝트 매니저', '교사', '의료진', '공무원', '금융 전문가'],
    pixie_butterfly: ['예술가', '광고 크리에이터', '웹 디자이너', '콘텐츠 제작자', '패션 디자이너'],
    sharp_wolf: ['CEO', '영업 관리자', '변호사', '투자 전문가', '경영 컨설턴트'],
    sweet_penguin: ['간호사', '사회복지사', '유치원 교사', '상담사', '비영리 활동가'],
    hipster_bear: ['큐레이터', '브랜드 기획자', '카페 사장', '라이프스타일 블로거', '인테리어 디자이너']
  };

  const careers = careerMap[archetype.id] || ['다양한 분야'];
  recommendations += careers.map(career => `• **${career}**`).join('\n') + '\n\n';

  recommendations += `### 성공 포인트\n`;
  recommendations += `당신의 **${archetype.name}** 특성을 활용하여 위 직업들에서 성공할 수 있습니다.\n\n`;

  return recommendations;
}

async function generateRelationshipGuide(
  archetype: Archetype,
  scores: NormalizedScores
): Promise<string> {
  let guide = `### 연애 스타일\n`;
  guide += `${archetype.name}인 당신은 `;

  if (scores.empathy >= 70) {
    guide += `감정적으로 깊이 교감하는 연애를 선호합니다. `;
  }
  if (scores.extroversion >= 70) {
    guide += `활발하고 사교적인 데이트를 즐깁니다. `;
  }
  if (scores.stability >= 70) {
    guide += `안정적이고 예측 가능한 관계를 중시합니다. `;
  }

  guide += `\n\n### 친구 관계\n`;
  guide += `소수의 진정한 친구들과 깊은 관계를 유지하는 것을 선호하며, 신뢰와 이해를 바탕으로 한 우정을 소중히 여깁니다.\n\n`;

  return guide;
}

async function generatePersonalizedRecommendations(
  archetype: Archetype,
  scores: NormalizedScores
): Promise<string> {
  let recommendations = `### 📚 추천 도서\n`;

  const booksByArchetype: { [key: string]: string[] } = {
    coffee_cat: ['어린왕자', '연금술사', '데미안'],
    urban_fox: ['린 스타트업', '마케팅 불변의 법칙', '스타트업 네이션'],
    adventure_rabbit: ['야생으로', '체르노빌의 봄', '걷기의 힘'],
    iron_bear: ['리더십의 법칙', '성공하는 사람들의 7가지 습관', '어떻게 살 것인가'],
    pixie_butterfly: ['창조적 습관', '아티스트 웨이', '상상력 사용법'],
    sharp_wolf: ['생각이 돈이 되는 순간', '초격차', '경영의 모험'],
    sweet_penguin: ['나는 나를 돌본다', '심리학이 이토록 쉬웠나', '공감'],
    hipster_bear: ['지적 대화를 위한 넓고 얕은 지식', '라이프스타일 디자인', '취향을 설계하는 곳']
  };

  const books = booksByArchetype[archetype.id] || ['자기계발서', '에세이', '소설'];
  recommendations += books.map(book => `• ${book}`).join('\n') + '\n\n';

  recommendations += `### 🎵 추천 음악 장르\n`;
  const musicByTrait = scores.creativity >= 70 ? '인디/얼터너티브' :
                      scores.empathy >= 70 ? 'R&B/소울' :
                      scores.extroversion >= 70 ? '팝/댄스' : '클래식/재즈';

  recommendations += `• ${musicByTrait}\n\n`;

  recommendations += `### 📍 추천 장소\n`;
  const placesByArchetype: { [key: string]: string[] } = {
    coffee_cat: ['조용한 카페', '도서관', '작은 갤러리'],
    urban_fox: ['루프탑 바', '전시회', '팝업 스토어'],
    adventure_rabbit: ['국립공원', '클라이밍 센터', '서핑 포인트'],
    iron_bear: ['온천', '캠핑장', '박물관'],
    pixie_butterfly: ['꽃시장', '아트센터', '공방'],
    sharp_wolf: ['비즈니스 클럽', '고급 레스토랑', '골프장'],
    sweet_penguin: ['동물원', '카페거리', '공원'],
    hipster_bear: ['빈티지샵', '독립서점', '로스터리 카페']
  };

  const places = placesByArchetype[archetype.id] || ['취향에 맞는 장소'];
  recommendations += places.map(place => `• ${place}`).join('\n') + '\n\n';

  return recommendations;
}

export { premiumContentCache };