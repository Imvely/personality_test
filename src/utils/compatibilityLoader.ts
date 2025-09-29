import { parseCSV } from './csvParser';

export interface CompatibilityData {
  target: string;
  compat_percent: number;
  explanation: string;
  rank: number;
}

// 아키타입 한글명을 ID로 매핑
const nameToIdMapping: { [key: string]: string } = {
  '커피고양이형': 'coffee_cat',
  '도심여우형': 'urban_fox',
  '모험토끼형': 'adventure_rabbit',
  '철벽곰형': 'iron_bear',
  '픽시버터플라이형': 'pixie_butterfly',
  '까칠늑대형': 'grumpy_wolf',
  '스위트펭귄형': 'sweet_penguin',
  '힙스터곰치형': 'hipster_bear'
};

// ID를 한글명으로 매핑
const idToNameMapping: { [key: string]: string } = {
  'coffee_cat': '커피고양이형',
  'urban_fox': '도심여우형',
  'adventure_rabbit': '모험토끼형',
  'iron_bear': '철벽곰형',
  'pixie_butterfly': '픽시버터플라이형',
  'grumpy_wolf': '까칠늑대형',
  'sweet_penguin': '스위트펭귄형',
  'hipster_bear': '힙스터곰치형'
};

let compatibilityCache: any[] | null = null;

export async function loadCompatibilityData(): Promise<any[]> {
  if (compatibilityCache) {
    return compatibilityCache;
  }

  try {
    const response = await fetch('/text/compatibility_top3.csv');
    if (!response.ok) {
      throw new Error('Failed to load compatibility data');
    }

    const csvText = await response.text();
    const data = parseCSV(csvText);

    compatibilityCache = data;
    return data;
  } catch (error) {
    console.error('Error loading compatibility data:', error);
    return [];
  }
}

export async function getCompatibilityInfo(archetypeId: string): Promise<CompatibilityData[]> {
  try {
    const data = await loadCompatibilityData();
    const archetypeName = idToNameMapping[archetypeId];

    if (!archetypeName) {
      return [];
    }

    const matches = data
      .filter(row => row.source === archetypeName)
      .map(row => ({
        target: nameToIdMapping[row.target] || row.target,
        targetName: row.target,
        compat_percent: row.compat_percent,
        explanation: row.explanation,
        rank: row.rank
      }))
      .sort((a, b) => a.rank - b.rank);

    return matches;
  } catch (error) {
    console.error('Error getting compatibility info:', error);
    return [];
  }
}

export function getCompatibilityLevel(percentage: number): string {
  if (percentage >= 70) return 'perfect';
  if (percentage >= 60) return 'great';
  if (percentage >= 50) return 'good';
  return 'challenging';
}

export function getCompatibilityEmoji(percentage: number): string {
  if (percentage >= 70) return '💫';
  if (percentage >= 60) return '✨';
  if (percentage >= 50) return '😊';
  return '🌈';
}

export function getCompatibilityMessage(percentage: number): string {
  if (percentage >= 70) return '운명적 궁합! 완벽한 케미를 자랑해요 ✨';
  if (percentage >= 60) return '환상적 궁합! 서로에게 좋은 영향을 줘요 💕';
  if (percentage >= 50) return '좋은 궁합! 편안하고 안정적인 관계예요 😊';
  return '성장하는 관계! 서로 다른 매력으로 배워가요 🌱';
}