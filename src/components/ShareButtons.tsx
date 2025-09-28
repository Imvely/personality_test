'use client';

import React from 'react';
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
`;

const ShareTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 10px;
`;

const ShareButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  width: 100%;
  max-width: 500px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ShareButton = styled(motion.button)<{ bgColor: string; textColor: string }>`
  background: ${props => props.bgColor};
  color: ${props => props.textColor};
  border: none;
  border-radius: 15px;
  padding: 15px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 12px 15px;
    font-size: 0.8rem;
  }
`;

const CopyLinkButton = styled(motion.button)`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  @media (max-width: 768px) {
    padding: 12px 25px;
    font-size: 0.9rem;
  }
`;

const ShareButtons: React.FC<ShareButtonsProps> = ({ archetype, scores, characterEmoji }) => {
  const generateShareText = () => {
    return `나는 ${archetype.name}! ${characterEmoji}\n${archetype.hook}\n\n60초만에 알아보는 나의 캐릭터 테스트 해보기 👇`;
  };

  const generateHashtags = () => {
    return `#${archetype.name} #심리테스트 #성격테스트 #MZ세대 #퍼스널테스트`;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleKakaoShare = () => {
    analytics.trackResultShared(archetype.id, 'kakao');

    if (typeof window !== 'undefined' && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `나는 ${archetype.name}!`,
          description: archetype.hook,
          imageUrl: `${shareUrl}/og-${archetype.id}.jpg`,
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

  const handleInstagramShare = () => {
    analytics.trackResultShared(archetype.id, 'instagram');

    const instagramUrl = `https://www.instagram.com/`;
    const text = `${generateShareText()}\n\n${generateHashtags()}`;

    if (navigator.share) {
      navigator.share({
        title: `나는 ${archetype.name}!`,
        text,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
      alert('링크가 복사되었어요! 인스타그램에 붙여넣기 해주세요.');
    }
  };

  const handleTwitterShare = () => {
    analytics.trackResultShared(archetype.id, 'twitter');

    const text = encodeURIComponent(generateShareText());
    const hashtags = encodeURIComponent('심리테스트,성격테스트,MZ세대');
    const url = encodeURIComponent(shareUrl);

    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&hashtags=${hashtags}&url=${url}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    analytics.trackResultShared(archetype.id, 'facebook');

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
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
          💬 카카오톡
        </ShareButton>

        <ShareButton
          bgColor="#E4405F"
          textColor="white"
          onClick={handleInstagramShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📸 인스타그램
        </ShareButton>

        <ShareButton
          bgColor="#1DA1F2"
          textColor="white"
          onClick={handleTwitterShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🐦 트위터
        </ShareButton>

        <ShareButton
          bgColor="#1877F2"
          textColor="white"
          onClick={handleFacebookShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📘 페이스북
        </ShareButton>
      </ShareButtonGrid>

      <CopyLinkButton
        onClick={handleCopyLink}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🔗 링크 복사하기
      </CopyLinkButton>
    </ShareContainer>
  );
};

export default ShareButtons;