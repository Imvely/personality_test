# 배포 가이드

## 🚀 배포 플랫폼 옵션

### 1. Vercel (추천)
Next.js 프로젝트에 최적화된 플랫폼

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경변수 설정
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add GA_TRACKING_ID
```

### 2. Netlify
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 빌드 및 배포
npm run build
netlify deploy --prod --dir=.next
```

### 3. AWS Amplify
```bash
# AWS CLI 설정 후
amplify init
amplify add hosting
amplify publish
```

## 🔧 환경 설정

### 필수 환경 변수
```bash
OPENAI_API_KEY=sk-...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
GA_TRACKING_ID=G-...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Stripe 웹훅 설정
1. Stripe 대시보드에서 웹훅 엔드포인트 추가
2. URL: `https://yourdomain.com/api/stripe-webhook`
3. 이벤트: `checkout.session.completed`, `payment_intent.succeeded`

## 📊 분석 설정

### Google Analytics 4
1. GA4 프로퍼티 생성
2. 측정 ID를 환경변수에 추가
3. 이벤트 추적 확인

### 커스텀 이벤트
- `test_started`: 테스트 시작
- `test_completed`: 테스트 완료
- `result_shared`: 결과 공유
- `premium_purchased`: 프리미엄 구매

## 🛡️ 보안 설정

### API 키 보안
- 환경변수로만 관리
- 클라이언트 사이드에 노출 금지
- 정기적인 키 로테이션

### CORS 설정
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://yourdomain.com'
          }
        ]
      }
    ]
  }
}
```

## 🔍 성능 최적화

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- CDN 설정 (Cloudinary, AWS CloudFront)
- WebP 포맷 지원

### 캐싱 전략
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

## 📱 모바일 최적화

### PWA 설정
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true
})

module.exports = withPWA({
  // Next.js config
})
```

### 메타 태그 최적화
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#667eea">
<link rel="manifest" href="/manifest.json">
```

## 🚨 모니터링

### 에러 추적
```bash
# Sentry 설정
npm install @sentry/nextjs
```

### 로그 수집
```javascript
// utils/logger.ts
export function logError(error: Error, context: any) {
  console.error('Error:', error, 'Context:', context);
  // 프로덕션에서는 외부 로그 서비스로 전송
}
```

## 📈 A/B 테스트 배포

### 점진적 배포
1. 10% 트래픽으로 테스트
2. 핵심 지표 모니터링
3. 단계적으로 100%까지 확장

### 피처 플래그
```javascript
// utils/featureFlags.ts
export const FEATURE_FLAGS = {
  NEW_UI: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
  PREMIUM_DISCOUNT: 0.3
}
```

## 🔄 CI/CD 설정

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 성능 목표

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### 사용자 경험
- 테스트 완료율: > 80%
- 페이지 로드 시간: < 3초
- 모바일 점수: > 90점

## 📋 배포 체크리스트

### 배포 전
- [ ] 모든 환경변수 설정 확인
- [ ] API 키 유효성 검증
- [ ] 결제 테스트 완료
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 반응형 확인
- [ ] SEO 메타태그 설정
- [ ] 소셜 공유 OG 태그 확인

### 배포 후
- [ ] DNS 설정 확인
- [ ] SSL 인증서 적용
- [ ] Google Search Console 등록
- [ ] 분석 도구 연동 확인
- [ ] 에러 모니터링 설정
- [ ] 백업 시스템 구축

## 🆘 장애 대응

### 롤백 절차
1. 이전 버전으로 즉시 롤백
2. 에러 로그 수집 및 분석
3. 핫픽스 개발 및 테스트
4. 재배포

### 응급 연락처
- DevOps: emergency@company.com
- 개발팀 리더: dev-lead@company.com
- 서비스 상태 페이지: status.yourdomain.com

---

💡 **팁**: 배포는 항상 점진적으로 진행하고, 핵심 지표를 실시간 모니터링하세요!