import { Question, UserAnswer, TraitScores, NormalizedScores, Archetype, TestResult } from '@/types';
import questionsData from '@/data/questions.json';
import archetypesData from '@/data/archetypes.json';

export function calculateTraitScores(answers: UserAnswer[]): TraitScores {
  const scores: TraitScores = {
    extroversion: 0,
    adventure: 0,
    stability: 0,
    empathy: 0,
    creativity: 0
  };

  const questions = questionsData as Question[];

  answers.forEach(userAnswer => {
    const question = questions.find(q => q.id === userAnswer.questionId);
    if (!question) return;

    const selectedTrait = userAnswer.answer === 'A' ? question.A_trait : question.B_trait;
    scores[selectedTrait] += question.weight;
  });

  return scores;
}

export function normalizeScores(traitScores: TraitScores, answers: UserAnswer[]): NormalizedScores {
  const questions = questionsData as Question[];

  const maxPossible = {
    extroversion: 0,
    adventure: 0,
    stability: 0,
    empathy: 0,
    creativity: 0
  };

  questions.forEach(question => {
    maxPossible[question.A_trait] += question.weight;
    maxPossible[question.B_trait] += question.weight;
  });

  const normalized: NormalizedScores = {
    extroversion: Math.round((traitScores.extroversion / maxPossible.extroversion) * 100),
    adventure: Math.round((traitScores.adventure / maxPossible.adventure) * 100),
    stability: Math.round((traitScores.stability / maxPossible.stability) * 100),
    empathy: Math.round((traitScores.empathy / maxPossible.empathy) * 100),
    creativity: Math.round((traitScores.creativity / maxPossible.creativity) * 100)
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

  const distances = archetypes.map(archetype => ({
    archetype,
    distance: calculateEuclideanDistance(normalizedScores, archetype.prototype)
  }));

  distances.sort((a, b) => a.distance - b.distance);

  const primaryMatch = distances[0];
  const secondaryMatch = distances[1];

  const result: TestResult = {
    archetype: primaryMatch.archetype,
    scores: normalizedScores,
    distance: primaryMatch.distance
  };

  if (secondaryMatch && (primaryMatch.distance - secondaryMatch.distance) < 50) {
    result.secondaryArchetype = secondaryMatch.archetype;
    result.secondaryDistance = secondaryMatch.distance;
  }

  return result;
}

export function scoreAnswers(answers: UserAnswer[]): TestResult {
  const traitScores = calculateTraitScores(answers);
  const normalizedScores = normalizeScores(traitScores, answers);
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