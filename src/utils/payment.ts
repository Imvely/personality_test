import { loadStripe, Stripe } from '@stripe/stripe-js';
import { analytics } from './analytics';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export interface PaymentSession {
  sessionId: string;
  clientSecret: string;
  customerId?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
}

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
}

export interface PaymentMetadata {
  userId?: string;
  sessionId: string;
  archetypeId: string;
  testResultId: string;
  productId: string;
}

export class PaymentManager {
  private static instance: PaymentManager;

  private constructor() {}

  public static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager();
    }
    return PaymentManager.instance;
  }

  public getProducts(): PaymentProduct[] {
    return [
      {
        id: 'premium_report',
        name: '프리미엄 성격 분석 리포트',
        description: '상세한 성격 분석과 맞춤형 추천을 제공하는 완전한 리포트',
        price: 2900,
        currency: 'KRW',
        features: [
          '상세 성격 분석 (800-1500자)',
          '맞춤 직업 추천',
          '인간관계 가이드',
          '성장을 위한 실천 팁',
          '개인화된 콘텐츠 추천',
          'PDF 다운로드'
        ]
      },
      {
        id: 'premium_bundle',
        name: '프리미엄 번들 (리포트 + 이미지)',
        description: '프리미엄 리포트와 고화질 개인화 이미지 패키지',
        price: 4900,
        currency: 'KRW',
        features: [
          '프리미엄 리포트 모든 기능',
          '개인화된 고화질 이미지 3종',
          'SNS 최적화 이미지',
          '무제한 다운로드',
          '친구 초대 할인 쿠폰'
        ]
      }
    ];
  }

  public async createPaymentSession(
    productId: string,
    metadata: PaymentMetadata
  ): Promise<PaymentSession> {
    try {
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const session = await response.json();

      analytics.track('payment_session_created', {
        product_id: productId,
        archetype_id: metadata.archetypeId,
        amount: this.getProducts().find(p => p.id === productId)?.price
      });

      return session;

    } catch (error) {
      console.error('Payment session creation failed:', error);
      throw new Error('결제 세션 생성에 실패했습니다. 다시 시도해주세요.');
    }
  }

  public async processPayment(sessionId: string): Promise<void> {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe initialization failed');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      analytics.track('payment_failed', {
        session_id: sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async verifyPayment(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      return result.success && result.paid;

    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  public getPaymentHistory(): PaymentSession[] {
    const historyData = localStorage.getItem('paymentHistory');
    return historyData ? JSON.parse(historyData) : [];
  }

  public savePaymentHistory(session: PaymentSession): void {
    const history = this.getPaymentHistory();
    history.push(session);
    localStorage.setItem('paymentHistory', JSON.stringify(history));
  }

  public hasValidPurchase(archetypeId: string): boolean {
    const history = this.getPaymentHistory();
    return history.some(session =>
      session.status === 'succeeded' &&
      // 결제 후 30일간 유효 (선택적)
      Date.now() - new Date(session.sessionId).getTime() < 30 * 24 * 60 * 60 * 1000
    );
  }
}

export class RefundManager {
  public static async requestRefund(sessionId: string, reason: string): Promise<boolean> {
    try {
      const response = await fetch('/api/request-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('Refund request failed');
      }

      const result = await response.json();

      analytics.track('refund_requested', {
        session_id: sessionId,
        reason
      });

      return result.success;

    } catch (error) {
      console.error('Refund request failed:', error);
      return false;
    }
  }

  public static getRefundPolicy(): string {
    return `
환불 정책

1. 환불 가능 기간
   - 구매 후 7일 이내
   - 디지털 콘텐츠 특성상 다운로드 전에만 가능

2. 환불 불가 사유
   - 이미 리포트를 다운로드한 경우
   - 단순 변심 (다운로드 후)
   - 7일 경과 후

3. 환불 절차
   - 고객센터 문의 또는 자동 환불 신청
   - 환불 사유 확인 후 처리
   - 3-5 영업일 내 환불 완료

4. 문의처
   - 이메일: support@personalitytest.com
   - 전화: 1588-1234 (평일 9-18시)
    `;
  }
}

export class ReceiptManager {
  public static async generateReceipt(sessionId: string): Promise<string> {
    try {
      const response = await fetch('/api/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Receipt generation failed');
      }

      const result = await response.json();
      return result.receiptUrl;

    } catch (error) {
      console.error('Receipt generation failed:', error);
      throw new Error('영수증 생성에 실패했습니다.');
    }
  }

  public static async emailReceipt(sessionId: string, email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/email-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email
        }),
      });

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('Email receipt failed:', error);
      return false;
    }
  }
}

export const paymentManager = PaymentManager.getInstance();