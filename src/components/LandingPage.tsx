'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { analytics, abTestManager } from '@/utils/analytics';
import { useRouter } from 'next/navigation';

const LandingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const MainCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 600px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 40px 30px;
    border-radius: 20px;
  }
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.3rem;
  color: #666;
  margin-bottom: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Description = styled(motion.p)`
  font-size: 1.1rem;
  color: #888;
  margin-bottom: 40px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 30px;
  }
`;

const StartButton = styled(motion.button)`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 20px 50px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 18px 40px;
    font-size: 1.1rem;
  }
`;

const FeatureList = styled(motion.div)`
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const FeatureItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 120px;
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const FeatureText = styled.p`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const LandingPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    analytics.trackPageView('landing');
    abTestManager.getUserVariant();
  }, []);

  const handleStartTest = () => {
    analytics.trackTestStart();
    router.push('/test');
  };

  return (
    <LandingContainer>
      <MainCard
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Title variants={itemVariants}>
          60초 안에 알아보는<br />
          나의 캐릭터 ✨
        </Title>

        <Subtitle variants={itemVariants}>
          MZ세대를 위한 퍼스널 심리테스트
        </Subtitle>

        <Description variants={itemVariants}>
          간단한 선택으로 당신의 성격을 동물 캐릭터로 표현해보세요.<br />
          친구들과 공유하고 비교해보는 재미까지!
        </Description>

        <StartButton
          variants={itemVariants}
          onClick={handleStartTest}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          테스트 시작하기 🚀
        </StartButton>

        <FeatureList variants={itemVariants}>
          <FeatureItem>
            <FeatureIcon>⏱️</FeatureIcon>
            <FeatureText>60초 완성</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🎯</FeatureIcon>
            <FeatureText>정확한 분석</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🎨</FeatureIcon>
            <FeatureText>감성적 결과</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureText>SNS 공유</FeatureText>
          </FeatureItem>
        </FeatureList>
      </MainCard>
    </LandingContainer>
  );
};

export default LandingPage;