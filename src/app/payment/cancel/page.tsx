'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { analytics } from '@/utils/analytics';

const CancelContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const CancelCard = styled(motion.div)`
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

const CancelIcon = styled(motion.div)`
  font-size: 5rem;
  margin-bottom: 30px;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
`;

const CancelTitle = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CancelMessage = styled(motion.p)`
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

  @media (max-width: 768px) {
    padding: 16px 35px;
    font-size: 1rem;
    min-width: 200px;
  }
`;

const PaymentCancelPage: React.FC = () => {
  const router = useRouter();

  React.useEffect(() => {
    analytics.trackPageView('payment_cancel');
    analytics.track('payment_cancelled', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleRetryPayment = () => {
    router.push('/result');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRetakeTest = () => {
    localStorage.removeItem('testResult');
    router.push('/');
  };

  return (
    <CancelContainer>
      <CancelCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <CancelIcon
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          😔
        </CancelIcon>

        <CancelTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          결제가 취소되었습니다
        </CancelTitle>

        <CancelMessage
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          결제를 완료하지 않으셨습니다.<br />
          언제든지 다시 시도하실 수 있어요!
        </CancelMessage>

        <ButtonContainer>
          <ActionButton
            primary
            onClick={handleRetryPayment}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💳 다시 결제하기
          </ActionButton>

          <ActionButton
            onClick={handleGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 홈으로 돌아가기
          </ActionButton>

          <ActionButton
            onClick={handleRetakeTest}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 테스트 다시하기
          </ActionButton>
        </ButtonContainer>
      </CancelCard>
    </CancelContainer>
  );
};

export default PaymentCancelPage;