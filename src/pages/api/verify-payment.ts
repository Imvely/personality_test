import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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

    // Stripe에서 세션 정보 조회
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent;

    res.status(200).json({
      success: true,
      paid: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('Payment verification error:', error);

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