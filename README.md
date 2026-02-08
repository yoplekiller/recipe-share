# Recipe Share

> 레시피 공유 서비스

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (상태관리)
- Axios

### Backend
- Express.js
- TypeScript
- SQLite (better-sqlite3)
- JWT 인증
- Multer (이미지 업로드)
- Zod (유효성 검사)

---

## 프로젝트 구조

```
recipe-share/
├── frontend/                 # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/             # App Router 페이지
│   │   ├── components/      # React 컴포넌트
│   │   ├── lib/             # 유틸리티, API
│   │   └── store/           # Zustand 스토어
│   └── ...
├── backend/                  # Express 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   ├── middleware/      # 미들웨어
│   │   ├── services/        # 비즈니스 로직
│   │   └── db/              # 데이터베이스
│   └── ...
└── package.json              # 루트 워크스페이스
```

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. 개발 서버 실행

```bash
# 전체 실행 (frontend + backend)
npm run dev

# 개별 실행
npm run dev:frontend  # localhost:3000
npm run dev:backend   # localhost:4000
```

---

## API 엔드포인트

### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 내 정보 |

### 레시피
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/recipes` | 목록 조회 |
| GET | `/api/recipes/:id` | 상세 조회 |
| POST | `/api/recipes` | 등록 |
| PUT | `/api/recipes/:id` | 수정 |
| DELETE | `/api/recipes/:id` | 삭제 |
| POST | `/api/recipes/:id/like` | 좋아요 |
| POST | `/api/recipes/:id/comments` | 댓글 |

### 업로드
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/upload/image` | 이미지 업로드 |

---

## 이미지 저장소

### 로컬 저장 (개발)
```env
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

### S3 저장 (프로덕션)
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-bucket
```

---

## 주요 기능

- [x] 회원가입/로그인 (JWT)
- [x] 레시피 CRUD
- [x] 이미지 업로드
- [x] 좋아요/댓글
- [ ] 검색
- [ ] 카테고리 필터
- [ ] 마이페이지
