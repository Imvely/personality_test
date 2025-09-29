import { Question, UserAnswer, TraitScores, NormalizedScores, Archetype, TestResult } from '@/types';

import archetypesData from '@/data/archetypes.json';
import { loadMaxScores } from './questionsLoader';

const TRAITS = ['extroversion', 'adventure', 'stability', 'empathy', 'creativity'] as const;

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

export async function normalizeScores(traitScores: TraitScores, questions: Question[]): Promise<NormalizedScores> {
  // CSV에서 불러온 최대 점수 대신 실제 계산된 최대 점수 사용
  const maxScores = calculateActualMaxScores(questions);

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

export function findMatchingArchetype(normalizedScores: NormalizedScores): TestResult {
  const archetypes = archetypesData as Archetype[];

  let best = null;
  let minDist = Infinity;

  archetypes.forEach(archetype => {
    let dist = 0;
    TRAITS.forEach(trait => {
      const diff = normalizedScores[trait] - archetype.prototype[trait];
      dist += diff * diff;
    });
    dist = Math.sqrt(dist);

    if (dist < minDist) {
      minDist = dist;
      best = archetype;
    }
  });

  if (!best) {
    throw new Error('No matching archetype found');
  }

  const result: TestResult = {
    archetype: best,
    scores: normalizedScores,
    distance: minDist
  };

  return result;
}

export async function scoreAnswers(answers: UserAnswer[], questions: Question[]): Promise<TestResult> {
  const traitScores = await calculateTraitScores(answers, questions);
  const normalizedScores = await normalizeScores(traitScores, questions);
  const result = findMatchingArchetype(normalizedScores);

  return result;
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