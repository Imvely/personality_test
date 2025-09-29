import { parseCSV, traitMapping } from './csvParser';
import { Question, TraitType } from '@/types';

export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('/text/questions_mapping.csv');
    if (!response.ok) {
      throw new Error('Failed to load questions');
    }

    const csvText = await response.text();
    const questionsData = parseCSV(csvText);

    return questionsData.map((row: any) => ({
      id: row.id,
      text: row.question,
      A_text: row.choice_a,
      B_text: row.choice_b,
      A_trait: traitMapping[row.A_trait] as TraitType,
      B_trait: traitMapping[row.B_trait] as TraitType,
      weight: row.weight
    }));
  } catch (error) {
    console.error('Error loading questions:', error);
    // 폴백으로 빈 배열 반환
    return [];
  }
}

// 최대 점수 데이터 로드
export async function loadMaxScores(): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch('/text/trait_max_possible.csv');
    if (!response.ok) {
      throw new Error('Failed to load max scores');
    }

    const csvText = await response.text();
    const maxScoresData = parseCSV(csvText);

    const maxScores: { [key: string]: number } = {};
    maxScoresData.forEach((row: any) => {
      const englishTrait = traitMapping[row.trait];
      if (englishTrait) {
        maxScores[englishTrait] = row.max_possible;
      }
    });

    return maxScores;
  } catch (error) {
    console.error('Error loading max scores:', error);
    // 기본값 반환
    return {
      extroversion: 11,
      adventure: 8,
      stability: 18,
      empathy: 11,
      creativity: 12
    };
  }
}