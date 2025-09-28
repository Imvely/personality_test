'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Archetype } from '@/types';
import { analytics, abTestManager } from '@/utils/analytics';

interface PremiumUpgradeProps {
  archetype: Archetype;
}

const PremiumContainer = styled(motion.div)<{ primaryColor: string }>`
  background: linear-gradient(135deg, ${props => props.primaryColor}15, ${props => props.primaryColor}05);
  border: 2px solid ${props => props.primaryColor}40;
  border-radius: 20px;
  padding: 30px;
  margin: 20px 0;
  text-align: center;
  width: 100%;

  @media (max-width: 768px) {
    padding: 25px 20px;
  }
`;

const PremiumBadge = styled.div<{ primaryColor: string }>`
  background: ${props => props.primaryColor};
  color: white;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-block;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const PremiumTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const PremiumDescription = styled.p`
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #555;
`;

const FeatureIcon = styled.span`
  font-size: 1.2rem;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
`;

const OriginalPrice = styled.span`
  font-size: 1.2rem;
  color: #999;
  text-decoration: line-through;
`;

const SalePrice = styled.span<{ primaryColor: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.primaryColor};
`;

const SaleBadge = styled.span`
  background: #e74c3c;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
`;

const PreviewButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50px;
  padding: 12px 25px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 15px;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 15px;
    width: 100%;
  }
`;

const PurchaseButton = styled(motion.button)<{ primaryColor: string }>`
  background: linear-gradient(45deg, ${props => props.primaryColor}, ${props => props.primaryColor}dd);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 18px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px ${props => props.primaryColor}40;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px ${props => props.primaryColor}50;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px 35px;
    font-size: 1rem;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 30px 25px;
    max-height: 90vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;

  &:hover {
    color: #333;
  }
`;

const PreviewContent = styled.div`
  text-align: left;
`;

const PreviewTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const PreviewText = styled.p`
  font-size: 1rem;
  line-height: 1.8;
  color: #555;
  margin-bottom: 20px;
`;

const PreviewNote = styled.div`
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  padding: 15px 20px;
  margin: 20px 0;
  border-radius: 0 10px 10px 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ archetype }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setShowPreview(true);
    analytics.track('premium_preview_viewed', {
      archetype: archetype.id
    });
  };

  const handlePurchase = () => {
    analytics.track('premium_purchase_started', {
      archetype: archetype.id,
      price: 2900
    });

    abTestManager.trackConversion('premium_purchase', 2900);

    // 목업: 결제 성공으로 가정하고 프리미엄 리포트 표시
    alert('✅ 목업 결제가 완료되었습니다! 프리미엄 리포트를 확인해보세요.');

    // 로컬 스토리지에 결제 완료 상태 저장
    localStorage.setItem('premiumPurchased', JSON.stringify({
      archetype: archetype.id,
      purchaseDate: new Date().toISOString(),
      status: 'completed'
    }));

    // 페이지 새로고침하여 프리미엄 상태 반영
    window.location.reload();
  };

  const previewText = `${archetype.paid_report.substring(0, 300)}...

  [전체 리포트에는 더 많은 내용이 포함됩니다]

  ✨ 완전한 성격 분석 (800-1500자)
  💼 추천 직업 및 커리어 가이드
  💝 인간관계 및 연애 스타일 분석
  🎯 3가지 실천 가능한 성장 팁
  📚 개인화된 책/음악/장소 추천`;

  return (
    <>
      <PremiumContainer
        primaryColor={archetype.colors.primary}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
      >
        <PremiumBadge primaryColor={archetype.colors.primary}>
          💎 Premium Report
        </PremiumBadge>

        <PremiumTitle>더 깊이 있는 나를 알아보세요</PremiumTitle>

        <PremiumDescription>
          무료 결과보다 5배 더 자세한 분석과 개인화된 추천을 받아보세요
        </PremiumDescription>

        <FeatureList>
          <FeatureItem>
            <FeatureIcon>📊</FeatureIcon>
            심층 성격 분석 리포트
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>💼</FeatureIcon>
            맞춤 직업 추천
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>💕</FeatureIcon>
            연애 & 인간관계 가이드
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🎯</FeatureIcon>
            성장을 위한 실천 팁
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📚</FeatureIcon>
            개인화된 추천 콘텐츠
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📱</FeatureIcon>
            고화질 PDF 다운로드
          </FeatureItem>
        </FeatureList>

        <PriceContainer>
          <OriginalPrice>₩4,900</OriginalPrice>
          <SalePrice primaryColor={archetype.colors.primary}>₩2,900</SalePrice>
          <SaleBadge>40% OFF</SaleBadge>
        </PriceContainer>

        <ButtonContainer>
          <PreviewButton
            onClick={handlePreview}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            👀 미리보기
          </PreviewButton>

          <PurchaseButton
            primaryColor={archetype.colors.primary}
            onClick={handlePurchase}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🛒 지금 구매하기
          </PurchaseButton>
        </ButtonContainer>
      </PremiumContainer>

      <AnimatePresence>
        {showPreview && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <ModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CloseButton onClick={() => setShowPreview(false)}>
                ✕
              </CloseButton>

              <PreviewContent>
                <PreviewTitle>💎 프리미엄 리포트 미리보기</PreviewTitle>

                <PreviewText>{previewText}</PreviewText>

                <PreviewNote>
                  <strong>💡 이것은 일부 미리보기입니다</strong><br />
                  실제 프리미엄 리포트는 더욱 상세하고 개인화된 분석을 제공합니다.
                </PreviewNote>

                <ButtonContainer>
                  <PurchaseButton
                    primaryColor={archetype.colors.primary}
                    onClick={handlePurchase}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    전체 리포트 구매하기 ₩2,900
                  </PurchaseButton>
                </ButtonContainer>
              </PreviewContent>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default PremiumUpgrade;