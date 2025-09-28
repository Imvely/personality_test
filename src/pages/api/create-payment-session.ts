import type { NextApiRequest, NextApiResponse } from 'next';
import { PaymentMetadata, PaymentProduct } from '@/utils/payment';

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

    // 목업 결제 세션 생성
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `mock_secret_${sessionId}`;

    res.status(200).json({
      success: true,
      sessionId,
      clientSecret
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export { products };