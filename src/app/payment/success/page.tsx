'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { analytics } from '@/utils/analytics';
import { paymentManager } from '@/utils/payment';

const SuccessContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const SuccessCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 600px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 30px;
    border-radius: 20px;
  }
`;

const SuccessIcon = styled(motion.div)`
  font-size: 5rem;
  margin-bottom: 30px;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
`;

const SuccessTitle = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SuccessMessage = styled(motion.p)`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
`;

const ActionButton = styled(motion.button)<{ primary?: boolean }>`
  background: ${props => props.primary
    ? 'linear-gradient(45deg, #667eea, #764ba2)'
    : 'rgba(255, 255, 255, 0.8)'};
  color: ${props => props.primary ? 'white' : '#333'};
  border: ${props => props.primary ? 'none' : '2px solid rgba(0, 0, 0, 0.1)'};
  border-radius: 50px;
  padding: 18px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary
      ? '0 12px 30px rgba(102, 126, 234, 0.4)'
      : '0 8px 25px rgba(0, 0, 0, 0.15)'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 16px 35px;
    font-size: 1rem;
    min-width: 200px;
  }
`;

const StatusMessage = styled(motion.div)<{ type: 'loading' | 'error' | 'success' }>`
  background: ${props =>
    props.type === 'loading' ? '#f0f8ff' :
    props.type === 'error' ? '#fee' :
    '#f0fff0'};
  color: ${props =>
    props.type === 'loading' ? '#0066cc' :
    props.type === 'error' ? '#cc0000' :
    '#006600'};
  border: 2px solid ${props =>
    props.type === 'loading' ? '#cce7ff' :
    props.type === 'error' ? '#ffcccc' :
    '#ccffcc'};
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  font-weight: 600;
  text-align: center;
`;

const LoadingSpinner = styled(motion.div)`
  width: 30px;
  height: 30px;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  display: inline-block;
  margin-right: 10px;
`;

const PaymentSuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
      analytics.trackPageView('payment_success');
    } else {
      setError('결제 세션 정보를 찾을 수 없습니다.');
      setIsVerifying(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setIsVerifying(true);

      const verified = await paymentManager.verifyPayment(sessionId!);

      if (verified) {
        setPaymentVerified(true);
        analytics.track('payment_verified', { session_id: sessionId });

        // 결제 내역 저장
        paymentManager.savePaymentHistory({
          sessionId: sessionId!,
          clientSecret: '',
          status: 'succeeded'
        });
      } else {
        setError('결제 확인에 실패했습니다. 고객센터로 문의해주세요.');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setError('결제 확인 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsGeneratingReport(true);

      // 로컬 스토리지에서 테스트 결과 가져오기
      const testResult = localStorage.getItem('testResult');
      if (!testResult) {
        throw new Error('테스트 결과를 찾을 수 없습니다.');
      }

      const { archetype, scores } = JSON.parse(testResult);

      // 프리미엄 리포트 생성 API 호출
      const response = await fetch('/api/premium-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          archetype,
          scores
        }),
      });

      if (!response.ok) {
        throw new Error('리포트 생성에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success && result.downloadUrl) {
        // PDF 다운로드
        window.open(result.downloadUrl, '_blank');

        analytics.track('premium_report_downloaded', {
          session_id: sessionId,
          archetype_id: archetype.id
        });
      } else {
        throw new Error(result.error || '리포트 다운로드에 실패했습니다.');
      }

    } catch (error) {
      console.error('Report download failed:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleViewResult = () => {
    router.push('/result');
  };

  if (isVerifying) {
    return (
      <SuccessContainer>
        <SuccessCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <StatusMessage type="loading">
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            결제를 확인하고 있습니다...
          </StatusMessage>
        </SuccessCard>
      </SuccessContainer>
    );
  }

  if (error) {
    return (
      <SuccessContainer>
        <SuccessCard
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SuccessIcon
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            ❌
          </SuccessIcon>

          <SuccessTitle>결제 확인 실패</SuccessTitle>

          <StatusMessage type="error">
            {error}
          </StatusMessage>

          <ButtonContainer>
            <ActionButton onClick={handleGoHome} primary>
              홈으로 돌아가기
            </ActionButton>
          </ButtonContainer>
        </SuccessCard>
      </SuccessContainer>
    );
  }

  return (
    <SuccessContainer>
      <SuccessCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <SuccessIcon
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          🎉
        </SuccessIcon>

        <SuccessTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          결제가 완료되었습니다!
        </SuccessTitle>

        <SuccessMessage
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          프리미엄 리포트를 다운로드 받으실 수 있습니다.<br />
          상세한 분석과 맞춤형 추천을 확인해보세요!
        </SuccessMessage>

        {paymentVerified && (
          <StatusMessage type="success">
            ✅ 결제가 성공적으로 확인되었습니다
          </StatusMessage>
        )}

        <ButtonContainer>
          <ActionButton
            primary
            onClick={handleDownloadReport}
            disabled={isGeneratingReport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGeneratingReport ? (
              <>
                <LoadingSpinner
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                리포트 생성 중...
              </>
            ) : (
              '📥 프리미엄 리포트 다운로드'
            )}
          </ActionButton>

          <ActionButton
            onClick={handleViewResult}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💫 결과 페이지로 돌아가기
          </ActionButton>

          <ActionButton
            onClick={handleGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 홈으로 돌아가기
          </ActionButton>
        </ButtonContainer>
      </SuccessCard>
    </SuccessContainer>
  );
};

export default PaymentSuccessPage;