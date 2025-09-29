export interface Question {
  id: number;
  text: string;
  A_text: string;
  B_text: string;
  A_trait: TraitType;
  B_trait: TraitType;
  weight: number;
}

export type TraitType = 'extroversion' | 'adventure' | 'stability' | 'empathy' | 'creativity';

export interface TraitScores {
  extroversion: number;
  adventure: number;
  stability: number;
  empathy: number;
  creativity: number;
}

export interface NormalizedScores {
  extroversion: number;
  adventure: number;
  stability: number;
  empathy: number;
  creativity: number;
}

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

export interface Archetype {
  id: string;
  name: string;
  prototype: NormalizedScores;
  hook: string;
  short_summary: string;
  paid_report: string;
  image_prompts: {
    avatar: string;
    og: string;
    story: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  compatibility?: CompatibilityInfo;
}

export interface TestResult {
  archetype: Archetype;
  scores: NormalizedScores;
  distance: number;
  secondaryArchetype?: Archetype;
  secondaryDistance?: number;
}

export interface UserAnswer {
  questionId: number;
  answer: 'A' | 'B';
}

export interface LLMPrompt {
  system: string;
  user: string;
}

export interface GeneratedContent {
  summary: string;
  snsCaption: string;
  deepReport: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  config: {
    questionCount?: number;
    imageStyle?: 'cute' | 'sophisticated';
    textTone?: 'emotional' | 'playful';
  };
  weight: number;
}

export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}