import type { NextApiRequest, NextApiResponse } from 'next';

interface RequestBody {
  sessionId: string;
}

interface ApiResponse {
  success: boolean;
  paid?: boolean;
  paymentStatus?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  error?: string;
}

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
    const { sessionId }: RequestBody = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing session ID'
      });
    }

    // 목업 결제 검증 - mock session이면 항상 성공
    if (sessionId.startsWith('mock_session_')) {
      res.status(200).json({
        success: true,
        paid: true,
        paymentStatus: 'paid',
        customerEmail: 'test@example.com',
        metadata: {
          productId: 'premium_report',
          archetypeId: 'test',
          testResultId: 'test'
        }
      });
      return;
    }

    // 실제 세션 ID인 경우 실패 처리
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}