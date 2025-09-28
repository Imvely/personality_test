import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { PaymentMetadata, PaymentProduct } from '@/utils/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface RequestBody {
  productId: string;
  metadata: PaymentMetadata;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface ApiResponse {
  success: boolean;
  sessionId?: string;
  clientSecret?: string;
  error?: string;
}

const products: PaymentProduct[] = [
  {
    id: 'premium_report',
    name: '프리미엄 성격 분석 리포트',
    description: '상세한 성격 분석과 맞춤형 추천을 제공하는 완전한 리포트',
    price: 2900,
    currency: 'KRW',
    features: []
  },
  {
    id: 'premium_bundle',
    name: '프리미엄 번들 (리포트 + 이미지)',
    description: '프리미엄 리포트와 고화질 개인화 이미지 패키지',
    price: 4900,
    currency: 'KRW',
    features: []
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      productId,
      metadata,
      customerEmail,
      successUrl,
      cancelUrl
    }: RequestBody = req.body;

    if (!productId || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: product.name,
              description: product.description,
              images: [`${baseUrl}/product-${productId}.jpg`],
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/payment/cancel`,
      customer_email: customerEmail,
      metadata: {
        productId,
        archetypeId: metadata.archetypeId,
        testResultId: metadata.testResultId,
        sessionId: metadata.sessionId,
        userId: metadata.userId || '',
      },
      payment_intent_data: {
        metadata: {
          productId,
          archetypeId: metadata.archetypeId,
          testResultId: metadata.testResultId,
          sessionId: metadata.sessionId,
          userId: metadata.userId || '',
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30분 후 만료
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['KR'], // 한국만 허용
      },
      locale: 'ko',
      automatic_tax: {
        enabled: false, // 한국 세금 처리 필요시 true로 변경
      },
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      clientSecret: session.client_secret
    });

  } catch (error) {
    console.error('Payment session creation error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export { products };