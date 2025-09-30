// CSV 파싱 유틸리티 (견고한 버전)
export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // 헤더 파싱
  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    if (!line.trim()) return null; // 빈 줄 건너뛰기

    const values = parseCSVLine(line);
    const obj: any = {};

    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/^\uFEFF/, '').trim(); // BOM 제거
      let value: any = values[index]?.trim() || '';

      // 따옴표 제거
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // 숫자로 변환 시도
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }

      obj[cleanHeader] = value;
    });

    return obj;
  }).filter(row => row !== null && Object.values(row).some(val => val !== '')); // 빈 행 제거
}

// CSV 라인을 따옴표를 고려하여 파싱
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// 특성 이름을 영어로 매핑
export const traitMapping: { [key: string]: string } = {
  '외향': 'extroversion',
  '모험': 'adventure',
  '안정': 'stability',
  '공감': 'empathy',
  '창의': 'creativity'
};