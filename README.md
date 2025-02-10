# ServingAI

AI 도구를 찾고, 사용법을 나누며 효율적으로 업무를 처리하는 데 도움을 주는 웹 플랫폼입니다.

## 주요 기능

- AI 툴 추천: 사용자가 원하는 업무에 맞는 AI 도구 추천
- 사용법 가이드: 각 AI 툴에 대한 설명, 사용법, 튜토리얼 제공
- 카테고리별 필터링: 업무 유형, 도구의 기능 등을 기준으로 AI 툴을 필터링
- 커뮤니티 기능: 툴 상세페이지에 유저 의견을 나눌 수 있는 리뷰 기능

## 기술 스택

- Frontend: React, Tailwind CSS
- Backend: Node.js + Express (예정)
- Database: Supabase
- 기타: Git

## 시작하기

1. 프로젝트 클론
\`\`\`bash
git clone [repository-url]
\`\`\`

2. 의존성 설치
\`\`\`bash
npm install
\`\`\`

3. 개발 서버 실행
\`\`\`bash
npm start
\`\`\`

## 프로젝트 구조

\`\`\`
serving-ai/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── pages/         # 페이지 컴포넌트
│   ├── App.jsx        # 메인 App 컴포넌트
│   └── index.js       # 엔트리 포인트
├── public/           # 정적 파일
└── package.json      # 프로젝트 의존성 및 스크립트
\`\`\`
