'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TestResult } from '@/types';
import { analytics, abTestManager } from '@/utils/analytics';
import { useRouter } from 'next/navigation';
import ShareButtons from '@/components/ShareButtons';
import PremiumUpgrade from '@/components/PremiumUpgrade';

const ResultContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ResultCard = styled(motion.div)<{ primaryColor: string }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 3px solid ${props => props.primaryColor};
  max-width: 800px;
  width: 100%;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    padding: 30px 25px;
    border-radius: 20px;
  }
`;

const CharacterImage = styled(motion.div)<{ primaryColor: string }>`
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, ${props => props.primaryColor}, ${props => props.primaryColor}80);
  border-radius: 50%;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
    font-size: 4.5rem;
  }
`;

const ArchetypeName = styled(motion.h1)<{ primaryColor: string }>`
  font-size: 3rem;
  font-weight: 800;
  color: ${props => props.primaryColor};
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Hook = styled(motion.p)<{ secondaryColor: string }>`
  font-size: 1.5rem;
  color: ${props => props.secondaryColor};
  text-align: center;
  margin-bottom: 30px;
  font-weight: 600;
  font-style: italic;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const Summary = styled(motion.p)`
  font-size: 1.2rem;
  color: #555;
  line-height: 1.8;
  text-align: center;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 30px;
  }
`;

const TraitContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const TraitItem = styled.div<{ primaryColor: string }>`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  border: 2px solid ${props => props.primaryColor}30;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const TraitName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TraitScore = styled.div<{ primaryColor: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.primaryColor};
  margin-bottom: 10px;
`;

const TraitBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const TraitFill = styled(motion.div)<{ primaryColor: string }>`
  height: 100%;
  background: linear-gradient(45deg, ${props => props.primaryColor}, ${props => props.primaryColor}80);
  border-radius: 4px;
`;

const SecondaryInfo = styled(motion.div)<{ accentColor: string }>`
  background: linear-gradient(135deg, ${props => props.accentColor}20, ${props => props.accentColor}10);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 30px;
  border: 2px solid ${props => props.accentColor}40;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const SecondaryTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
`;

const SecondaryText = styled.p`
  font-size: 1.1rem;
  color: #555;
  line-height: 1.6;
  text-align: center;
`;

const ActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const RestartButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  color: #333;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  padding: 15px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
`;

const traitNames = {
  extroversion: '외향성',
  adventure: '모험심',
  stability: '안정성',
  empathy: '공감능력',
  creativity: '창의성'
};

const getCharacterEmoji = (archetypeId: string): string => {
  const emojiMap: { [key: string]: string } = {
    coffee_cat: '🐱',
    urban_fox: '🦊',
    adventure_rabbit: '🐰',
    iron_bear: '🐻',
    pixie_butterfly: '🦋',
    sharp_wolf: '🐺',
    sweet_penguin: '🐧',
    hipster_bear: '🐻‍❄️'
  };
  return emojiMap[archetypeId] || '🌟';
};

const ResultPage: React.FC = () => {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    analytics.trackPageView('result');

    const savedResult = localStorage.getItem('testResult');
    if (savedResult) {
      const parsedResult = JSON.parse(savedResult) as TestResult;
      setResult(parsedResult);
      setIsLoading(false);
    } else {
      router.push('/');
    }

    // 프리미엄 구매 상태 확인
    const premiumStatus = localStorage.getItem('premiumPurchased');
    if (premiumStatus) {
      const premium = JSON.parse(premiumStatus);
      setIsPremiumUser(premium.status === 'completed');
    }
  }, [router]);

  const handleRestart = () => {
    localStorage.removeItem('testResult');
    router.push('/');
  };

  if (isLoading || !result) {
    return (
      <LoadingContainer>
        <LoadingSpinner
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <LoadingText>결과를 불러오고 있어요...</LoadingText>
      </LoadingContainer>
    );
  }

  const { archetype, scores, secondaryArchetype } = result;
  const characterEmoji = getCharacterEmoji(archetype.id);

  return (
    <ResultContainer>
      <ResultCard
        primaryColor={archetype.colors.primary}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <CharacterImage
          primaryColor={archetype.colors.primary}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {characterEmoji}
        </CharacterImage>

        <ArchetypeName
          primaryColor={archetype.colors.primary}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {archetype.name}
        </ArchetypeName>

        <Hook
          secondaryColor={archetype.colors.secondary}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {archetype.hook}
        </Hook>

        <Summary
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {archetype.short_summary}
        </Summary>

        <TraitContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          {Object.entries(scores).map(([trait, score], index) => (
            <TraitItem key={trait} primaryColor={archetype.colors.primary}>
              <TraitName>{traitNames[trait as keyof typeof traitNames]}</TraitName>
              <TraitScore primaryColor={archetype.colors.primary}>
                {score}%
              </TraitScore>
              <TraitBar>
                <TraitFill
                  primaryColor={archetype.colors.primary}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.8 }}
                />
              </TraitBar>
            </TraitItem>
          ))}
        </TraitContainer>

        {secondaryArchetype && (
          <SecondaryInfo
            accentColor={archetype.colors.accent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <SecondaryTitle>보조 성향</SecondaryTitle>
            <SecondaryText>
              당신은 {secondaryArchetype.name}의 특성도 가지고 있어요!
              두 성향이 조화롭게 어우러진 독특한 매력을 가진 분이네요.
            </SecondaryText>
          </SecondaryInfo>
        )}

        <ActionContainer>
          <ShareButtons
            archetype={archetype}
            scores={scores}
            characterEmoji={characterEmoji}
          />

          {!isPremiumUser && <PremiumUpgrade archetype={archetype} />}

          {isPremiumUser && (
            <SecondaryInfo accentColor={archetype.colors.accent}>
              <SecondaryTitle>🎉 프리미엄 회원</SecondaryTitle>
              <SecondaryText>
                프리미엄 리포트를 구매해주셔서 감사합니다!<br />
                위의 상세 분석이 도움이 되셨기를 바라요.
              </SecondaryText>
            </SecondaryInfo>
          )}

          <RestartButton
            onClick={handleRestart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            다시 테스트하기 🔄
          </RestartButton>
        </ActionContainer>
      </ResultCard>
    </ResultContainer>
  );
};

export default ResultPage;