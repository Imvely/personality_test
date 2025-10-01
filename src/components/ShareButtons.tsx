'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Archetype, NormalizedScores } from '@/types';
import { analytics } from '@/utils/analytics';

interface ShareButtonsProps {
  archetype: Archetype;
  scores: NormalizedScores;
  characterEmoji: string;
}

const ShareContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 25px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 20px;
    gap: 15px;
  }
`;

const ShareTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 5px;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ShareSubtitle = styled.p`
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const ShareButtonGrid = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 500px;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    max-width: 280px;
  }
`;

const ShareButton = styled(motion.button)<{ bgColor: string; textColor: string }>`
  background: ${props => props.bgColor};
  color: ${props => props.textColor};
  border: none;
  border-radius: 20px;
  padding: 16px 24px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex: 1;
  min-height: 56px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 14px 20px;
    font-size: 0.9rem;
    min-height: 50px;
    gap: 8px;
  }
`;

const CopiedMessage = styled(motion.div)`
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
`;

const ShareButtons: React.FC<ShareButtonsProps> = ({ archetype, scores, characterEmoji }) => {
  const generateShareText = () => {
    // hook과 short 내용을 포함한 공유 텍스트
    return `${characterEmoji} 나는 ${archetype.name}!

${archetype.hook}

${archetype.short_summary}

60초만에 알아보는 나의 캐릭터 테스트 👇`;
  };

  const generateHashtags = () => {
    return `#${archetype.name} #심리테스트 #성격테스트 #인스타감성 #퍼스널테스트`;
  };

  // basePath를 포함한 전체 URL
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const basePath = process.env.NODE_ENV === 'production' ? '/personality-test' : '';
    return `${origin}${basePath}`;
  };

  const shareUrl = getShareUrl();

  const handleKakaoShare = () => {
    analytics.trackResultShared(archetype.id, 'kakao');

    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const origin = window.location.origin;
      const basePath = process.env.NODE_ENV === 'production' ? '/personality-test' : '';
      const ogImageUrl = `${origin}${basePath}/api/og-image?character=${archetype.id}&emoji=${encodeURIComponent(characterEmoji)}`;

      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${characterEmoji} 나는 ${archetype.name}!`,
          description: `${archetype.hook}\n\n${archetype.short_summary}`,
          imageUrl: ogImageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '나도 테스트하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } else {
      handleFallbackShare('KakaoTalk');
    }
  };


  const handleFallbackShare = (platform: string) => {
    const text = `${generateShareText()}\n\n${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: `나는 ${archetype.name}!`,
        text,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert(`${platform} 공유 링크가 복사되었어요!`);
    }
  };

  const handleCopyLink = async () => {
    analytics.trackResultShared(archetype.id, 'copy_link');

    const text = `${generateShareText()}\n\n${shareUrl}`;

    try {
      await navigator.clipboard.writeText(text);
      alert('결과와 링크가 복사되었어요! 🎉');
    } catch (err) {
      console.error('복사 실패:', err);
      alert('링크 복사에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <ShareContainer>
      <ShareTitle>친구들에게 공유해보세요! 📢</ShareTitle>

      <ShareButtonGrid>
        <ShareButton
          bgColor="#FEE500"
          textColor="#000"
          onClick={handleKakaoShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💬 카카오톡으로 공유
        </ShareButton>

        <ShareButton
          bgColor="#667eea"
          textColor="white"
          onClick={handleCopyLink}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔗 링크 복사하기
        </ShareButton>
      </ShareButtonGrid>
    </ShareContainer>
  );
};

export default ShareButtons;