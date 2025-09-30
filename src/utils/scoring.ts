import { Question, UserAnswer, TraitScores, NormalizedScores, Archetype, TestResult } from '@/types';

import { loadMaxScores } from './questionsLoader';
import { loadArchetypeData, ArchetypeData } from './archetypeLoader';

const TRAITS = ['extroversion', 'adventure', 'stability', 'empathy', 'creativity'] as const;

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

export async function calculateTraitScores(answers: UserAnswer[], questions: Question[]): Promise<TraitScores> {
  const scores: TraitScores = {
    extroversion: 0,
    adventure: 0,
    stability: 0,
    empathy: 0,
    creativity: 0
  };

  answers.forEach(userAnswer => {
    const question = questions.find(q => q.id === userAnswer.questionId);
    if (!question) return;

    const selectedTrait = userAnswer.answer === 'A' ? question.A_trait : question.B_trait;
    if (selectedTrait && scores.hasOwnProperty(selectedTrait)) {
      scores[selectedTrait] += question.weight || 1; // 실제 weight 값 사용
    }
  });

  return scores;
}

// 질문 데이터로부터 실제 최대 점수를 계산하는 함수
export function calculateActualMaxScores(questions: Question[]): TraitScores {
  const maxScores: TraitScores = {
    extroversion: 0,
    adventure: 0,
    stability: 0,
    empathy: 0,
    creativity: 0
  };

  questions.forEach(question => {
    // A 특성의 최대 기여도 추가
    if (question.A_trait && maxScores.hasOwnProperty(question.A_trait)) {
      maxScores[question.A_trait] += question.weight || 1;
    }
    // B 특성의 최대 기여도 추가
    if (question.B_trait && maxScores.hasOwnProperty(question.B_trait)) {
      maxScores[question.B_trait] += question.weight || 1;
    }
  });

  return maxScores;
}

export async function normalizeScores(traitScores: TraitScores): Promise<NormalizedScores> {
  // trait_max_possible.csv에서 최대 점수 로드
  const maxScores = await loadMaxScores();

  const normalized: NormalizedScores = {
    extroversion: Math.min(100, Math.max(0, Math.round((traitScores.extroversion / maxScores.extroversion) * 100))),
    adventure: Math.min(100, Math.max(0, Math.round((traitScores.adventure / maxScores.adventure) * 100))),
    stability: Math.min(100, Math.max(0, Math.round((traitScores.stability / maxScores.stability) * 100))),
    empathy: Math.min(100, Math.max(0, Math.round((traitScores.empathy / maxScores.empathy) * 100))),
    creativity: Math.min(100, Math.max(0, Math.round((traitScores.creativity / maxScores.creativity) * 100)))
  };

  return normalized;
}

export function calculateEuclideanDistance(scores: NormalizedScores, prototype: NormalizedScores): number {
  const diffSquared =
    Math.pow(scores.extroversion - prototype.extroversion, 2) +
    Math.pow(scores.adventure - prototype.adventure, 2) +
    Math.pow(scores.stability - prototype.stability, 2) +
    Math.pow(scores.empathy - prototype.empathy, 2) +
    Math.pow(scores.creativity - prototype.creativity, 2);

  return Math.sqrt(diffSquared);
}

export async function findMatchingArchetype(normalizedScores: NormalizedScores): Promise<TestResult> {
  const archetypeData = await loadArchetypeData();

  let bestArchetype: ArchetypeData | null = null;
  let minDistance = Infinity;

  archetypeData.forEach(archetype => {
    const [extroversion, adventure, creativity, empathy, stability] = archetype.prototype;

    // 유클리디안 거리 계산
    const distance = Math.sqrt(
      Math.pow(normalizedScores.extroversion - extroversion, 2) +
      Math.pow(normalizedScores.adventure - adventure, 2) +
      Math.pow(normalizedScores.creativity - creativity, 2) +
      Math.pow(normalizedScores.empathy - empathy, 2) +
      Math.pow(normalizedScores.stability - stability, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      bestArchetype = archetype;
    }
  });

  if (!bestArchetype) {
    throw new Error('No matching archetype found');
  }

  // 타입 확정을 위한 단언
  const selectedArchetype = bestArchetype as ArchetypeData;

  // archetype 데이터를 기존 형식으로 변환
  const result: TestResult = {
    archetype: {
      id: selectedArchetype.id,
      name: selectedArchetype.name,
      colors: getArchetypeColors(selectedArchetype.id),
      hook: selectedArchetype.hook,
      short_summary: selectedArchetype.short,
      paid_report: '', // CSV에서는 제공되지 않는 필드
      image_prompts: {
        avatar: '',
        og: '',
        story: ''
      }, // CSV에서는 제공되지 않는 필드
      prototype: {
        extroversion: selectedArchetype.prototype[0],
        adventure: selectedArchetype.prototype[1],
        creativity: selectedArchetype.prototype[2],
        empathy: selectedArchetype.prototype[3],
        stability: selectedArchetype.prototype[4]
      }
    },
    scores: normalizedScores,
    distance: minDistance
  };

  return result;
}

export async function scoreAnswers(answers: UserAnswer[], questions: Question[]): Promise<TestResult> {
  try {
    console.log('Starting scoreAnswers with:', { answersCount: answers.length, questionsCount: questions.length });

    const traitScores = await calculateTraitScores(answers, questions);
    console.log('Calculated trait scores:', traitScores);

    const normalizedScores = await normalizeScores(traitScores);
    console.log('Normalized scores:', normalizedScores);

    const result = await findMatchingArchetype(normalizedScores);
    console.log('Found matching archetype:', result.archetype.id);

    return result;
  } catch (error) {
    console.error('Error in scoreAnswers:', error);
    throw error;
  }
}

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
    stability: {
      high: '안정성과 예측 가능성을 중시하는',
      medium: '균형감 있는',
      low: '변화와 자극을 추구하는'
    },
    empathy: {
      high: '높은 공감 능력과 감수성을 가진',
      medium: '적절한 공감 능력을 가진',
      low: '논리적이고 객관적인'
    },
    creativity: {
      high: '창의적이고 독창적인',
      medium: '적당한 창의성을 가진',
      low: '실용적이고 현실적인'
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