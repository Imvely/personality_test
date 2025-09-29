export interface DeepReportData {
  id: string;
  hook: string;
  short: string;
  long_report: string;
}

// 아키타입 ID를 한글명으로 매핑
const archetypeNameMapping: { [key: string]: string } = {
  'coffee_cat': '커피고양이형',
  'urban_fox': '도심여우형',
  'adventure_rabbit': '모험토끼형',
  'iron_bear': '철벽곰형',
  'pixie_butterfly': '픽시버터플라이형',
  'grumpy_wolf': '까칠늑대형',
  'sweet_penguin': '스위트펭귄형',
  'hipster_bear': '힙스터곰치형'
};

let deepReportsCache: { [key: string]: string } | null = null;

export async function loadDeepReports(): Promise<{ [key: string]: string }> {
  if (deepReportsCache) {
    return deepReportsCache;
  }

  try {
    const response = await fetch('/text/deep_reports.json');
    if (!response.ok) {
      throw new Error('Failed to load deep reports');
    }

    const reportsData = await response.json();
    deepReportsCache = reportsData;
    return reportsData;
  } catch (error) {
    console.error('Error loading deep reports:', error);
    return {};
  }
}

export async function getDeepReport(archetypeId: string): Promise<DeepReportData | null> {
  try {
    const reports = await loadDeepReports();
    const archetypeName = archetypeNameMapping[archetypeId];

    if (!archetypeName || !reports[archetypeName]) {
      return null;
    }

    const reportText = reports[archetypeName];

    // 보고서에서 파이썬 딕셔너리 형태의 텍스트를 파싱
    const match = reportText.match(/{'id': '([^']+)', 'hook': '([^']+)', 'short': '([^']+)', 'long_report': '([^']+)'}/);

    if (!match) {
      // 매칭이 안되면 전체 텍스트를 long_report로 사용
      return {
        id: archetypeId,
        hook: `${archetypeName}의 특별한 매력`,
        short: '당신만의 독특한 성격 특성을 가지고 있어요.',
        long_report: reportText
      };
    }

    const [, id, hook, short, long_report] = match;

    return {
      id: id || archetypeId,
      hook: hook || `${archetypeName}의 특별한 매력`,
      short: short || '당신만의 독특한 성격 특성을 가지고 있어요.',
      long_report: long_report || reportText
    };
  } catch (error) {
    console.error('Error getting deep report:', error);
    return null;
  }
}

// 공유용 재미있는 텍스트 생성
export function generateShareText(archetypeId: string, hook: string): string {
  const shareTexts = [
    `나는 ${hook}라는 결과가 나왔는데, 너무 공감돼서 소름 🤯`,
    `심리테스트 결과: ${hook} ✨ 이거 완전 나잖아?`,
    `${hook}... 이건 진짜 찐이다 👀 너도 해봐!`,
    `결과보고 헉소리남 ${hook} 맞냐고 이거 ㅋㅋㅋ`,
    `${hook} 이런 나를 발견했다 😎 신기방기`
  ];

  return shareTexts[Math.floor(Math.random() * shareTexts.length)];
}

// 결과에서 "MZ" 단어 제거하는 함수
export function cleanMZText(text: string): string {
  return text
    .replace(/MZ\s*감성\s*포인트/g, '감성 포인트')
    .replace(/MZ\s*세대/g, '젊은 세대')
    .replace(/MZ\s*친화적/g, '트렌디한')
    .replace(/MZ\s*/g, '')
    .replace(/✨\s*MZ\s*감성\s*포인트\s*✨[\s\S]*$/, '') // MZ 감성 포인트 부분 완전 제거
    .replace(/✨\s*감성\s*포인트\s*✨[\s\S]*$/, '') // 감성 포인트 부분도 제거
    .trim();
}

// 텍스트를 읽기 쉽게 포맷팅하는 함수
export function formatReportText(text: string): string {
  return text
    // 문장 끝의 마침표 뒤에 줄바꿈 추가 (단, 축약어나 숫자 뒤가 아닌 경우)
    .replace(/\. (?![0-9])/g, '.\n\n')
    // 중국어나 일본어 등의 마침표도 처리
    .replace(/。 /g, '。\n\n')
    // 감탄부호나 물음표 뒤에도 줄바꿈 추가
    .replace(/[!?] /g, (match) => match.trim() + '\n\n')
    // 예를 들어, 예시 등의 패턴 앞에 줄바꿈 추가
    .replace(/(예를 들어|다만|반면|이를 보완하기 위해|작은 습관으로는)/g, '\n\n$1')
    // 연속된 줄바꿈을 정리
    .replace(/\n\n\n+/g, '\n\n')
    // 양쪽 공백 제거
    .trim();
}