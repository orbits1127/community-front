<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally and deploy to Vercel.

View your app in AI Studio: https://ai.studio/apps/drive/1lO7Dr_F0LhGjBBiExXy_Vo-YueI_-_u_

## Run Locally

**Prerequisites:** Node.js, PostgreSQL (또는 Neon/Supabase 등 원격 Postgres)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and set variables:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: PostgreSQL 연결 문자열 (예: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`)
   - (선택) `NEXT_PUBLIC_GEMINI_API_KEY` 또는 `NEXT_PUBLIC_API_KEY`: Gemini API 키
3. Create database schema (first time):
   ```bash
   npx prisma db push
   ```
   또는 마이그레이션 사용 시:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

이 프로젝트는 **PostgreSQL**과 **Vercel Blob**(파일 업로드용)을 사용하도록 설정되어 있습니다.

### 1. PostgreSQL 데이터베이스 준비

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com) 등에서 PostgreSQL 인스턴스를 생성합니다.
- 연결 문자열(Connection String)을 복사합니다.

### 2. Vercel에 프로젝트 배포

1. [Vercel](https://vercel.com)에 로그인 후 **Add New** → **Project**에서 이 저장소를 임포트합니다.
2. **Environment Variables**에 다음을 추가합니다:

   | 이름 | 값 | 비고 |
   |------|-----|------|
   | `DATABASE_URL` | `postgresql://...` | **필수**. PostgreSQL 연결 문자열 |
   | `BLOB_READ_WRITE_TOKEN` | (자동 또는 수동) | **파일 업로드용**. Vercel 대시보드 Storage > Blob 생성 시 자동 추가됨 |
   | `NEXT_PUBLIC_GEMINI_API_KEY` | (선택) | Explore 피드용 Gemini API 키 |

3. **Blob 스토어 생성 (파일 업로드 사용 시)**  
   Vercel 프로젝트 대시보드 → **Storage** → **Create Database** → **Blob** 선택 후 생성.  
   생성 후 `BLOB_READ_WRITE_TOKEN`이 프로젝트 환경 변수에 자동으로 추가됩니다.

4. **스키마 적용 (최초 1회)**  
   로컬에서 프로덕션 DB에 마이그레이션 적용:
   ```bash
   DATABASE_URL="postgresql://프로덕션연결문자열" npx prisma db push
   ```
   또는 마이그레이션 사용 시:
   ```bash
   DATABASE_URL="postgresql://프로덕션연결문자열" npx prisma migrate deploy
   ```

5. **Deploy** 버튼으로 배포합니다.

### 3. Next.js Image와 Vercel Blob

업로드된 이미지를 `next/image`로 사용할 때, Blob URL 호스트를 허용해야 합니다.  
배포 후 이미지가 차단되면 `next.config.js`의 `images.remotePatterns`에 실제 Blob URL의 호스트를 추가하세요.  
(예: `https://xxxxx.public.blob.vercel-storage.com` → hostname `xxxxx.public.blob.vercel-storage.com`)

### 요약 체크리스트

- [ ] PostgreSQL DB 생성 및 `DATABASE_URL` 설정
- [ ] (파일 업로드 사용 시) Vercel Blob 스토어 생성 및 `BLOB_READ_WRITE_TOKEN` 확인
- [ ] 최초 1회 `prisma db push` 또는 `prisma migrate deploy`로 스키마 적용
- [ ] 배포 후 필요 시 `next.config.js`에 Blob 이미지 호스트 추가
