// CSV 파싱 유틸리티
export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};

    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/^\uFEFF/, '').trim(); // BOM 제거
      let value: any = values[index]?.trim() || '';

      // 숫자로 변환 시도
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }

      obj[cleanHeader] = value;
    });

    return obj;
  }).filter(row => Object.values(row).some(val => val !== '')); // 빈 행 제거
}

// 특성 이름을 영어로 매핑
export const traitMapping: { [key: string]: string } = {
  '외향': 'extroversion',
  '모험': 'adventure',
  '안정': 'stability',
  '공감': 'empathy',
  '창의': 'creativity'
};