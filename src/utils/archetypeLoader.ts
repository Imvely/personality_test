import { parseCSV } from './csvParser';

export interface ArchetypeData {
  id: string;
  name: string;
  prototype: number[]; // [외향, 모험, 창의, 공감, 안정]
  hook: string;
  short: string;
}

export interface ArchetypeScores {
  extroversion: number;
  adventure: number;
  creativity: number;
  empathy: number;
  stability: number;
}

let archetypeCache: ArchetypeData[] | null = null;

export async function loadArchetypeData(): Promise<ArchetypeData[]> {
  if (archetypeCache) {
    return archetypeCache;
  }

  try {
    const response = await fetch('/text/archetypes_summary.csv');
    if (!response.ok) {
      throw new Error('Failed to load archetype data');
    }

    const csvText = await response.text();
    const data = parseCSV(csvText);

    const archetypes = data.map(row => ({
      id: row.id,
      name: row.name,
      prototype: JSON.parse(row.prototype), // "[25, 20, 65, 85, 80]" → [25, 20, 65, 85, 80]
      hook: row.hook,
      short: row.short
    }));

    archetypeCache = archetypes;
    return archetypes;
  } catch (error) {
    console.error('Error loading archetype data:', error);
    return [];
  }
}

export async function getArchetypeScores(archetypeId: string): Promise<ArchetypeScores | null> {
  try {
    const data = await loadArchetypeData();
    const archetype = data.find(item => item.id === archetypeId);

    if (!archetype) {
      return null;
    }

    const [extroversion, adventure, creativity, empathy, stability] = archetype.prototype;

    return {
      extroversion,
      adventure,
      creativity,
      empathy,
      stability
    };
  } catch (error) {
    console.error('Error getting archetype scores:', error);
    return null;
  }
}