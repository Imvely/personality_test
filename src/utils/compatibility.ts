import { Archetype } from '@/types';
import archetypesData from '@/data/archetypes.json';

export interface CompatibilityMatch {
  id: string;
  name: string;
  percentage: number;
  reason: string;
}

export interface CompatibilityInfo {
  best_match: CompatibilityMatch;
  good_matches: CompatibilityMatch[];
  challenging_match: CompatibilityMatch;
}

export interface DetailedCompatibility {
  compatibility: CompatibilityInfo;
  additional_details: {
    relationship_style: string;
    ideal_date: string;
    conflict_resolution: string;
    long_term_potential: string;
  };
}

// 아키타입별 관계 스타일 정보
const relationshipStyles: { [key: string]: any } = {
  coffee_cat: {
    relationship_style: "깊고 진정성 있는 관계를 추구하며, 소수의 사람과 강한 유대감을 형성합니다.",
    ideal_date: "조용한 카페에서 책을 읽거나 영화를 보며 깊은 대화를 나누는 시간",
    conflict_resolution: "감정을 충분히 표현하고 상대방의 마음을 이해하려고 노력합니다.",
    long_term_potential: "안정적이고 지속적인 관계를 중시하며, 함께 성장하는 것을 좋아합니다."
  },
  urban_fox: {
    relationship_style: "다양한 사람들과 네트워킹을 즐기며, 흥미롭고 자극적인 관계를 선호합니다.",
    ideal_date: "새로운 레스토랑이나 전시회, 팝업 스토어 등 트렌디한 장소에서의 데이트",
    conflict_resolution: "창의적이고 실용적인 해결책을 찾으며, 변화를 통해 문제를 해결합니다.",
    long_term_potential: "서로에게 자극을 주고받으며 함께 새로운 경험을 만들어가는 관계를 원합니다."
  },
  adventure_rabbit: {
    relationship_style: "에너지 넘치고 활동적인 관계를 좋아하며, 함께 모험을 떠나는 것을 즐깁니다.",
    ideal_date: "하이킹, 여행, 스포츠 등 활동적이고 모험적인 데이트",
    conflict_resolution: "직접적이고 솔직한 대화를 통해 빠르게 문제를 해결하려고 합니다.",
    long_term_potential: "함께 새로운 도전과 모험을 계속해서 만들어가는 역동적인 관계를 추구합니다."
  },
  iron_bear: {
    relationship_style: "신뢰할 수 있고 든든한 관계를 중시하며, 상대방을 보호하고 지지합니다.",
    ideal_date: "집에서 함께 요리하거나 자연 속에서 편안하게 시간을 보내는 것",
    conflict_resolution: "차분하고 신중하게 문제를 분석하며, 안정적인 해결책을 찾습니다.",
    long_term_potential: "평생에 걸친 안정적이고 신뢰할 수 있는 동반자 관계를 만들어갑니다."
  },
  pixie_butterfly: {
    relationship_style: "감성적이고 예술적인 관계를 추구하며, 서로의 창의성을 격려합니다.",
    ideal_date: "미술관, 콘서트, 공방 체험 등 예술적이고 창의적인 활동",
    conflict_resolution: "감정을 예술적으로 표현하며, 창의적인 방법으로 화해를 시도합니다.",
    long_term_potential: "서로의 예술적 감각을 키워주며 함께 아름다운 추억을 만들어가는 관계입니다."
  },
  sharp_wolf: {
    relationship_style: "독립적이면서도 목표 지향적인 관계를 선호하며, 서로의 성취를 응원합니다.",
    ideal_date: "고급 레스토랑에서의 디너나 비즈니스 이벤트, 새로운 투자 기회 탐색",
    conflict_resolution: "논리적이고 효율적인 방법으로 문제를 해결하며, 결과 중심적으로 접근합니다.",
    long_term_potential: "서로의 커리어와 목표를 지지하며 함께 성공을 만들어가는 파워 커플이 됩니다."
  },
  sweet_penguin: {
    relationship_style: "따뜻하고 배려심 넘치는 관계를 추구하며, 상대방을 돌보는 것을 좋아합니다.",
    ideal_date: "함께 봉사활동을 하거나 가족, 친구들과 함께하는 따뜻한 모임",
    conflict_resolution: "공감과 이해를 바탕으로 서로의 마음을 달래며 화해를 추구합니다.",
    long_term_potential: "서로를 아끼고 돌보며 주변 사람들에게도 긍정적인 영향을 주는 관계입니다."
  },
  hipster_bear: {
    relationship_style: "개성 있고 세련된 관계를 추구하며, 서로의 취향과 문화적 감성을 존중합니다.",
    ideal_date: "독립서점, 빈티지샵, 로스터리 카페 등 개성 있는 공간에서의 데이트",
    conflict_resolution: "균형 잡힌 시각으로 문제를 바라보며, 창의적이면서도 실용적인 해결책을 찾습니다.",
    long_term_potential: "서로의 개성을 인정하며 함께 독특하고 의미 있는 라이프스타일을 만들어갑니다."
  }
};

export function getCompatibilityInfo(archetypeId: string): DetailedCompatibility | null {
  const archetype = archetypesData.find(a => a.id === archetypeId);
  if (!archetype || !archetype.compatibility) {
    return null;
  }

  const relationshipInfo = relationshipStyles[archetypeId];

  return {
    compatibility: archetype.compatibility,
    additional_details: relationshipInfo
  };
}

export function calculateDynamicCompatibility(userArchetype: Archetype, targetArchetypeId: string): number {
  const targetArchetype = archetypesData.find(a => a.id === targetArchetypeId);
  if (!targetArchetype) return 0;

  // 성격 특성 간 거리 계산
  const userTraits = userArchetype.prototype;
  const targetTraits = targetArchetype.prototype;

  // 유클리디안 거리 계산
  const distance = Math.sqrt(
    Math.pow(userTraits.extroversion - targetTraits.extroversion, 2) +
    Math.pow(userTraits.adventure - targetTraits.adventure, 2) +
    Math.pow(userTraits.stability - targetTraits.stability, 2) +
    Math.pow(userTraits.empathy - targetTraits.empathy, 2) +
    Math.pow(userTraits.creativity - targetTraits.creativity, 2)
  );

  // 거리를 백분율로 변환 (가까울수록 높은 점수)
  const maxDistance = Math.sqrt(5 * 100 * 100); // 최대 가능한 거리
  const similarity = 100 - (distance / maxDistance) * 100;

  return Math.round(similarity);
}

// 특별한 궁합 메시지들
export const specialCompatibilityMessages = {
  perfect_match: [
    "🌟 운명적인 만남! 서로에게 완벽한 파트너입니다.",
    "💫 마치 퍼즐 조각처럼 완벽하게 맞아떨어지는 관계입니다.",
    "✨ 서로의 부족한 부분을 채워주는 이상적인 궁합입니다."
  ],
  great_match: [
    "💖 환상적인 케미! 함께 있으면 시너지가 폭발합니다.",
    "🎯 서로를 이해하고 응원하는 멋진 관계가 될 것입니다.",
    "🔥 열정적이고 역동적인 관계를 만들어갈 수 있습니다."
  ],
  good_match: [
    "😊 편안하고 안정적인 관계를 형성할 수 있습니다.",
    "🤝 서로 다른 매력으로 좋은 영향을 주고받는 관계입니다.",
    "🌱 함께 성장하며 발전해나갈 수 있는 건강한 관계입니다."
  ],
  challenging_match: [
    "🌈 차이가 있지만 그만큼 배울 점이 많은 관계입니다.",
    "🎢 때로는 어려울 수 있지만 서로를 통해 성장할 수 있습니다.",
    "💪 서로 다른 강점으로 보완하며 발전할 수 있는 관계입니다."
  ]
};

export function getCompatibilityMessage(percentage: number): string {
  if (percentage >= 90) {
    return specialCompatibilityMessages.perfect_match[0];
  } else if (percentage >= 80) {
    return specialCompatibilityMessages.great_match[0];
  } else if (percentage >= 60) {
    return specialCompatibilityMessages.good_match[0];
  } else {
    return specialCompatibilityMessages.challenging_match[0];
  }
}