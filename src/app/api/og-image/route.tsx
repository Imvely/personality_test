import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const characterEmojis = {
  coffee_cat: '🐱',
  urban_fox: '🦊',
  adventure_rabbit: '🐰',
  iron_bear: '🐻',
  pixie_butterfly: '🦋',
  grumpy_wolf: '🐺',
  sweet_penguin: '🐧',
  hipster_bear: '🐻‍❄️'
};

const characterNames = {
  coffee_cat: '커피고양이형',
  urban_fox: '도심여우형',
  adventure_rabbit: '모험토끼형',
  iron_bear: '철벽곰형',
  pixie_butterfly: '픽시버터플라이형',
  grumpy_wolf: '까칠늑대형',
  sweet_penguin: '스위트펭귄형',
  hipster_bear: '힙스터곰치형'
};

const characterColors = {
  coffee_cat: { primary: '#8B4513', secondary: '#D2691E', accent: '#F4A460' },
  urban_fox: { primary: '#FF4500', secondary: '#FF6347', accent: '#FFA500' },
  adventure_rabbit: { primary: '#32CD32', secondary: '#98FB98', accent: '#ADFF2F' },
  iron_bear: { primary: '#696969', secondary: '#A9A9A9', accent: '#C0C0C0' },
  pixie_butterfly: { primary: '#FF69B4', secondary: '#FFB6C1', accent: '#FFC0CB' },
  grumpy_wolf: { primary: '#2F4F4F', secondary: '#708090', accent: '#778899' },
  sweet_penguin: { primary: '#4169E1', secondary: '#87CEEB', accent: '#B0E0E6' },
  hipster_bear: { primary: '#8A2BE2', secondary: '#9370DB', accent: '#DDA0DD' }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('character') || 'coffee_cat';
    const customEmoji = searchParams.get('emoji'); // URL에서 이모지 파라미터 받기

    const emoji = customEmoji || characterEmojis[characterId as keyof typeof characterEmojis] || '🐱';
    const name = characterNames[characterId as keyof typeof characterNames] || '커피고양이형';
    const colors = characterColors[characterId as keyof typeof characterColors] || characterColors.coffee_cat;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            fontFamily: 'system-ui',
          }}
        >
          {/* 배경 장식 */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              fontSize: '60px',
              opacity: 0.3,
            }}
          >
            ✨
          </div>
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              fontSize: '60px',
              opacity: 0.3,
            }}
          >
            💫
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontSize: '60px',
              opacity: 0.3,
            }}
          >
            🌟
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '60px',
              opacity: 0.3,
            }}
          >
            ⭐
          </div>

          {/* 메인 콘텐츠 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '30px',
              padding: '60px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: `4px solid ${colors.accent}`,
            }}
          >
            {/* 캐릭터 이모지 - 훨씬 더 크게 */}
            <div
              style={{
                fontSize: '200px',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {emoji}
            </div>

            {/* 캐릭터 이름 */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {name}
            </div>

            {/* 타이틀 */}
            <div
              style={{
                fontSize: '28px',
                color: '#666',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              내 성격 유형 테스트 결과
            </div>

            {/* 부제목 */}
            <div
              style={{
                fontSize: '24px',
                color: colors.secondary,
                textAlign: 'center',
                fontWeight: '600',
              }}
            >
              🔮 당신의 성격을 발견해보세요!
            </div>
          </div>

          {/* 하단 브랜딩 */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '500',
            }}
          >
            Personality Test
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('OG Image generation failed:', e.message);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}