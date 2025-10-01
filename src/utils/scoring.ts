import { Question, UserAnswer, TraitScores, NormalizedScores, Archetype, TestResult } from '@/types';
import { loadMaxScores } from './questionsLoader';
import { loadArchetypeData, ArchetypeData } from './archetypeLoader';

// trait 순서: [외향, 모험, 창의, 공감, 안정]
const TRAIT_ORDER = ['extroversion', 'adventure', 'creativity', 'empathy', 'stability'] as const;

// 캐릭터별 색상 매핑
function getArchetypeColors(archetypeId: string) {
  const colorMap: { [key: string]: { primary: string; secondary: string; accent: string } } = {
    coffee_cat: { primary: '#8B4513', secondary: '#D2691E', accent: '#F4A460' },
    urban_fox: { primary: '#FF4500', secondary: '#FF6347', accent: '#FFA500' },
    adventure_rabbit: { primary: '#32CD32', secondary: '#98FB98', accent: '#ADFF2F' },
    iron_bear: { primary: '#696969', secondary: '#A9A9A9', accent: '#C0C0C0' },
    pixie_butterfly: { primary: '#FF69B4', secondary: '#FFB6C1', accent: '#FFC0CB' },
    grumpy_wolf: { primary: '#2F4F4F', secondary: '#708090', accent: '#778899' },
    sweet_penguin: { primary: '#4169E1', secondary: '#87CEEB', accent: '#B0E0E6' },
    hipster_bear: { primary: '#8A2BE2', secondary: '#9370DB', accent: '#DDA0DD' }
  };

  return colorMap[archetypeId] || { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' };
}

// 1단계: Raw 점수 계산
export async function calculateTraitScores(answers: UserAnswer[], questions: Question[]): Promise<TraitScores> {
  const scores: TraitScores = {
    extroversion: 0,
    adventure: 0,
    creativity: 0,
    empathy: 0,
    stability: 0
  };

  answers.forEach(userAnswer => {
    const question = questions.find(q => q.id === userAnswer.questionId);
    if (!question) return;

    const selectedTrait = userAnswer.answer === 'A' ? question.A_trait : question.B_trait;
    const weight = question.weight || 1;

    if (selectedTrait && scores.hasOwnProperty(selectedTrait)) {
      scores[selectedTrait] += weight;
    }
  });

  return scores;
}

// 2단계: 정규화 (0-100)
export async function normalizeScores(traitScores: TraitScores): Promise<NormalizedScores> {
  // trait_max_possible.csv에서 최대 점수 로드
  const maxScores = await loadMaxScores();

  const normalized: NormalizedScores = {
    extroversion: 0,
    adventure: 0,
    creativity: 0,
    empathy: 0,
    stability: 0
  };

  // 각 trait에 대해 정규화
  for (const trait of TRAIT_ORDER) {
    const maxScore = maxScores[trait] || 1;
    normalized[trait] = Math.round((traitScores[trait] / maxScore) * 100);
    // 0-100 범위로 제한
    normalized[trait] = Math.min(100, Math.max(0, normalized[trait]));
  }

  return normalized;
}

// 3단계: Euclidean Distance 계산
function calculateEuclideanDistance(userScores: NormalizedScores, prototype: number[]): number {
  // userScores를 배열로 변환 (trait_order 순서대로)
  const userVector = TRAIT_ORDER.map(trait => userScores[trait]);

  // 유클리디안 거리 계산
  let sumSquared = 0;
  for (let i = 0; i < userVector.length; i++) {
    sumSquared += Math.pow(userVector[i] - prototype[i], 2);
  }

  return Math.sqrt(sumSquared);
}

// 4단계: 아키타입 매칭
export async function findMatchingArchetype(normalizedScores: NormalizedScores): Promise<TestResult> {
  const archetypeData = await loadArchetypeData();

  if (archetypeData.length === 0) {
    throw new Error('No archetype data available');
  }

  // 모든 아키타입에 대해 거리 계산
  const distances: Array<{ archetype: ArchetypeData; distance: number }> = [];

  archetypeData.forEach(archetype => {
    const distance = calculateEuclideanDistance(normalizedScores, archetype.prototype);
    distances.push({ archetype, distance });
  });

  // 거리가 가장 짧은 아키타입 선택
  distances.sort((a, b) => a.distance - b.distance);
  const best = distances[0];

  // 유사도 퍼센트 계산 (선택사항 - display용)
  const maxDistance = Math.max(...distances.map(d => d.distance)) || 1;
  const similarityPercent = Math.max(0, 100 - (best.distance / maxDistance * 100));

  console.log('Archetype matching results:', {
    best: best.archetype.name,
    distance: best.distance.toFixed(3),
    similarity: similarityPercent.toFixed(1) + '%',
    userScores: normalizedScores,
    prototype: best.archetype.prototype
  });

  // TestResult 형식으로 변환
  const result: TestResult = {
    archetype: {
      id: best.archetype.id,
      name: best.archetype.name,
      colors: getArchetypeColors(best.archetype.id),
      hook: best.archetype.hook,
      short_summary: best.archetype.short,
      paid_report: '',
      image_prompts: {
        avatar: '',
        og: '',
        story: ''
      },
      prototype: {
        extroversion: best.archetype.prototype[0],
        adventure: best.archetype.prototype[1],
        creativity: best.archetype.prototype[2],
        empathy: best.archetype.prototype[3],
        stability: best.archetype.prototype[4]
      }
    },
    scores: normalizedScores,
    distance: best.distance,
    similarityPercent: Math.round(similarityPercent)
  };

  return result;
}

// 메인 점수 계산 함수
export async function scoreAnswers(answers: UserAnswer[], questions: Question[]): Promise<TestResult> {
  try {
    console.log('=== Starting Score Calculation ===');
    console.log('Answers count:', answers.length);
    console.log('Questions count:', questions.length);

    // 1단계: Raw 점수 계산
    const rawScores = await calculateTraitScores(answers, questions);
    console.log('Raw scores:', rawScores);

    // 2단계: 정규화 (0-100)
    const normalizedScores = await normalizeScores(rawScores);
    console.log('Normalized scores (0-100):', normalizedScores);

    // 3단계 & 4단계: 아키타입 매칭
    const result = await findMatchingArchetype(normalizedScores);
    console.log('Best match:', result.archetype.name, `(distance: ${result.distance.toFixed(3)})`);

    return result;
  } catch (error) {
    console.error('Error in scoreAnswers:', error);
    throw error;
  }
}

// 유틸리티 함수들
export function getTraitIntensity(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getTraitDescription(trait: keyof NormalizedScores, intensity: 'low' | 'medium' | 'high'): string {
  const descriptions = {
    extroversion: {
      high: '매우 외향적이고 사교적인',
      medium: '적당히 사교적인',
      low: '내향적이고 조용한'
    },
    adventure: {
      high: '모험을 즐기고 새로운 것을 추구하는',
      medium: '적당한 모험심을 가진',
      low: '안전하고 익숙한 것을 선호하는'
    },
    creativity: {
      high: '창의적이고 독창적인',
      medium: '적당한 창의성을 가진',
      low: '실용적이고 현실적인'
    },
    empathy: {
      high: '높은 공감 능력과 감수성을 가진',
      medium: '적절한 공감 능력을 가진',
      low: '논리적이고 객관적인'
    },
    stability: {
      high: '안정성과 예측 가능성을 중시하는',
      medium: '균형감 있는',
      low: '변화와 자극을 추구하는'
    }
  };

  return descriptions[trait][intensity];
}

export function generatePersonalityProfile(scores: NormalizedScores): string {
  const traits = Object.keys(scores) as (keyof NormalizedScores)[];
  const descriptions = traits.map(trait => {
    const intensity = getTraitIntensity(scores[trait]);
    return getTraitDescription(trait, intensity);
  });

  return descriptions.join(', ') + ' 성향을 가지고 있습니다.';
}
