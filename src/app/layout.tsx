import './globals.css'
import { Inter } from 'next/font/google'
import StyledComponentsRegistry from '@/components/StyledComponentsRegistry'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MZ 퍼스널 심리테스트 - 60초만에 알아보는 나의 캐릭터',
  description: '60초 안에 완료 가능한 양자택일 심리테스트로 당신의 성격을 동물 캐릭터로 표현해보세요. MZ세대를 위한 재미있고 감성적인 성격 분석 서비스입니다.',
  keywords: 'personality test, psychology, MZ, quiz, 심리테스트, 성격테스트, 캐릭터',
  openGraph: {
    title: 'MZ 퍼스널 심리테스트',
    description: '60초만에 알아보는 나의 캐릭터',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MZ 퍼스널 심리테스트',
    description: '60초만에 알아보는 나의 캐릭터',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}