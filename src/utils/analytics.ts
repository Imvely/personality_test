import { AnalyticsEvent, ABTestVariant } from '@/types';

export class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeGA();
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeGA(): void {
    // 목업: GA 초기화 로그만 출력
    if (typeof window !== 'undefined') {
      console.log('🎯 Analytics initialized (목업 모드)');
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    console.log('📊 User ID set:', userId, '(목업 모드)');
  }

  public track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      eventName,
      properties,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.events.push(event);

    // 목업: 콘솔에만 로그 출력
    console.log('📈 Analytics Event (목업):', eventName, properties);
  }

  public trackTestStart(): void {
    this.track('test_started', {
      timestamp: new Date().toISOString()
    });
  }

  public trackQuestionAnswered(questionId: number, answer: 'A' | 'B', timeSpent: number): void {
    this.track('question_answered', {
      question_id: questionId,
      answer,
      time_spent_ms: timeSpent
    });
  }

  public trackTestCompleted(archetype: string, totalTime: number, questionCount: number): void {
    this.track('test_completed', {
      archetype,
      total_time_ms: totalTime,
      question_count: questionCount,
      completion_rate: 100
    });
  }

  public trackResultShared(archetype: string, platform: string): void {
    this.track('result_shared', {
      archetype,
      platform
    });
  }

  public trackPaidReportPurchased(archetype: string, price: number): void {
    this.track('paid_report_purchased', {
      archetype,
      price,
      currency: 'KRW'
    });
  }

  public trackPageView(page: string): void {
    this.track('page_view', {
      page,
      url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }
}

export class ABTestManager {
  private static instance: ABTestManager;
  private variants: ABTestVariant[] = [
    {
      id: 'control',
      name: 'Control - 30 questions, cute style, emotional tone',
      config: {
        questionCount: 30,
        imageStyle: 'cute',
        textTone: 'emotional'
      },
      weight: 40
    },
    {
      id: 'variant_a',
      name: 'Variant A - 18 questions, sophisticated style, emotional tone',
      config: {
        questionCount: 18,
        imageStyle: 'sophisticated',
        textTone: 'emotional'
      },
      weight: 30
    },
    {
      id: 'variant_b',
      name: 'Variant B - 30 questions, cute style, playful tone',
      config: {
        questionCount: 30,
        imageStyle: 'cute',
        textTone: 'playful'
      },
      weight: 30
    }
  ];

  private userVariant: ABTestVariant | null = null;

  private constructor() {}

  public static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  public getUserVariant(): ABTestVariant {
    if (this.userVariant) {
      return this.userVariant;
    }

    const cached = typeof window !== 'undefined' ? localStorage.getItem('ab_test_variant') : null;
    if (cached) {
      const variant = this.variants.find(v => v.id === cached);
      if (variant) {
        this.userVariant = variant;
        return variant;
      }
    }

    const selectedVariant = this.selectRandomVariant();
    this.userVariant = selectedVariant;

    if (typeof window !== 'undefined') {
      localStorage.setItem('ab_test_variant', selectedVariant.id);
    }

    Analytics.getInstance().track('ab_test_assigned', {
      variant_id: selectedVariant.id,
      variant_name: selectedVariant.name
    });

    return selectedVariant;
  }

  private selectRandomVariant(): ABTestVariant {
    const totalWeight = this.variants.reduce((sum, variant) => sum + variant.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const variant of this.variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant;
      }
    }

    return this.variants[0];
  }

  public trackConversion(conversionType: string, value?: number): void {
    const variant = this.getUserVariant();
    Analytics.getInstance().track('ab_test_conversion', {
      variant_id: variant.id,
      conversion_type: conversionType,
      value
    });
  }
}

export const analytics = Analytics.getInstance();
export const abTestManager = ABTestManager.getInstance();