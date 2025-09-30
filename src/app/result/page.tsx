import React from 'react';
import ResultPage from '@/components/ResultPage';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '성격 유형 테스트 결과 | Personality Test',
    description: '당신의 성격 유형과 특성을 확인해보세요! 8가지 독특한 캐릭터 중 어떤 유형인지 알아보세요.',
    openGraph: {
      title: '나의 성격 유형 테스트 결과',
      description: '당신만의 특별한 성격 유형을 발견했어요! 결과를 확인해보세요 ✨',
      images: [
        {
          url: '/api/og-image',
          width: 1200,
          height: 630,
          alt: '성격 유형 테스트 결과',
        },
      ],
      type: 'website',
      siteName: 'Personality Test',
    },
    twitter: {
      card: 'summary_large_image',
      title: '나의 성격 유형 테스트 결과',
      description: '당신만의 특별한 성격 유형을 발견했어요! 🔮',
      images: ['/api/og-image'],
    },
  };
}

export default function Result() {
  return <ResultPage />;
}