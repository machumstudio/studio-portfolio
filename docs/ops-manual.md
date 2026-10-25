# 운영 매뉴얼

Machum Studio 사이트를 운영하는 사람을 위한 안내입니다. 앞부분(1~6)은 개발을 몰라도 되는 운영자용, 뒷부분(7~)은 사이트를 넘겨받는 개발자용입니다.

- 사이트: https://machum-studio.vercel.app (영어: `/en`)
- 관리자: https://machum-studio.vercel.app/admin/login

관리자 비밀번호는 이 문서나 레포 어디에도 적지 않습니다. 비밀번호 관리 프로그램에 보관하세요.

---

## 1. 관리자 로그인
1. `/admin/login` 을 엽니다. 관리자 화면은 한국어만 있습니다
2. 이메일과 비밀번호를 넣고 **로그인**을 누르면 작업 목록(`/admin`)으로 갑니다
3. 다 쓰면 오른쪽 위 **로그아웃**을 누릅니다. 공용 컴퓨터에서는 꼭 로그아웃하세요

- 로그인이 안 되면 "이메일 또는 비밀번호가 올바르지 않습니다" 한 가지 문구만 나옵니다 (어느 쪽이 틀렸는지 알려 주지 않는 것이 정상입니다)
- "지금은 로그인할 수 없습니다"가 나오면 저장소(Supabase)가 멈춘 경우가 많습니다 → [6. 자주 묻는 문제](#6-자주-묻는-문제)
- 비밀번호를 잊었으면 개발자에게 새 비밀번호를 요청합니다 (사이트에 비밀번호 찾기 기능은 없습니다)

![관리자 작업 목록](screenshots/admin-works.jpg)

## 2. 작업(포트폴리오) 관리
작업 목록에는 대표 사진, 제목, 공개 여부, 촬영 연월, 사진 수가 보입니다. 각 작업의 **고치기**로 편집하고, **공개 화면**으로 실제 화면을 새 탭에서 봅니다.

### 작업 만들기
1. **새 작업 만들기**를 누릅니다
2. 제목(한국어/영어), 주소 이름, 분야, 촬영 연월을 넣습니다
   - 주소 이름은 작업 상세 주소(`/work/주소-이름`)가 됩니다. 영문 소문자, 숫자, 하이픈(-)만 됩니다. 영어 제목을 쓰면 자동으로 채워집니다
   - 한 번 공개한 작업의 주소 이름을 바꾸면 예전 주소가 404 가 됩니다. 이미 알려진 주소라면 바꾸기 전에 개발자에게 알려 주세요 (301 연결)
3. 사진을 올립니다 (아래)
4. **공개하기**를 켜고 **저장**하면 홈과 포트폴리오에 바로 보입니다. 끄고 저장하면 관리자만 봅니다

### 사진 올리기
![작업 편집 화면의 사진](screenshots/admin-work-edit.jpg)

- 사진 칸에 끌어다 놓거나 **사진 고르기**로 여러 장을 한 번에 고릅니다
- JPG, PNG, WebP 만 됩니다. 원본 한 장 50MB 까지, 작업 하나에 30장까지
- 아이폰 HEIC 사진은 안 됩니다. 사진 앱의 공유 메뉴에서 JPG 로 저장한 뒤 올리세요
- 올리기 전에 브라우저가 긴 변 2400px 로 줄이고 촬영 위치 같은 정보(EXIF)를 지웁니다
- 다 올라간 뒤 **저장**하세요. 올리는 중에는 저장이 막힙니다
- 사진마다 설명(한국어/영어)을 넣으면 화면을 읽어 주는 프로그램이 읽습니다. 비워도 됩니다

### 순서와 대표 사진
- 순서: 사진을 끌어서 놓거나 **앞으로/뒤로** 버튼. 첫 사진부터 차례로 보입니다
- 대표 사진: **대표로 지정**. 목록, 홈, 포트폴리오, 공유 카드에 쓰입니다. 처음에는 첫 사진이 대표이고, 대표 사진을 빼면 남은 첫 사진이 대표가 됩니다
- 바꾼 뒤 **저장**해야 반영됩니다. 저장하지 않은 변경이 있으면 화면에 알려 줍니다

### 공개 / 비공개
- **공개하기**를 끄고 저장하면 공개 화면에서 사라집니다 (작업 상세 주소도 404)
- 비공개 작업의 사진도 사진 주소를 정확히 아는 사람은 열 수 있습니다. 주소는 짐작할 수 없는 긴 이름이지만, 절대 보이면 안 되는 사진은 올리지 마세요

### 지우기
- 편집 화면의 **작업 지우기** → 확인 창에서 **지우기**. 작업과 사진 파일이 모두 지워지고 **되돌릴 수 없습니다**
- 사진 한 장만 빼려면 사진의 휴지통(**빼기**) 버튼 → **저장**
- 지운 사진도 최적화한 사진 주소로는 최대 7일 더 열릴 수 있습니다 (원래 주소를 아는 사람만). 바로 막아야 하면 개발자에게 요청하세요

## 3. 문의 관리
관리자 메뉴의 **문의**에 "새 문의 N건"이 보입니다.

![관리자 문의 목록](screenshots/admin-inquiries.jpg)

### 확인하기
- 목록은 최신순 20건씩입니다. 위의 **전체 / 새 문의 / 확인 / 완료**로 거릅니다
- 카드를 누르면 상세가 열립니다: 전체 메시지, 이메일, 전화번호(남긴 경우), 받은 시각

![관리자 문의 상세](screenshots/admin-inquiry.jpg)

### 상태 바꾸기 (확인 → 완료)
- **열어 보기만 해서는 상태가 바뀌지 않습니다.** 실수로 연 문의가 "새 문의"에서 사라지지 않게 직접 바꿉니다
- 읽었지만 아직 답장 전이면 **확인으로 바꾸기**, 답장까지 끝냈으면 **완료로 바꾸기**
- 다시 처리해야 하면 완료된 문의에서 **다시 열기** (확인으로 돌아갑니다)
- 다른 탭이나 휴대폰에서 먼저 바꿨으면 "먼저 바꿨습니다" 알림과 함께 지금 상태를 다시 보여 줍니다. 확인한 뒤 필요하면 다시 누르세요

### 답장하기
- **메일로 답장**을 누르면 받는 사람과 제목이 채워진 메일 앱이 열립니다
- 알림 메일에 바로 답장해도 됩니다 (아래 4)
- 답장한 뒤 **완료로 바꾸기**를 눌러 두면 놓친 문의를 찾기 쉽습니다

### 지우기
- 상세의 **문의 지우기** → 확인 창. 문의와 연락처가 완전히 지워지고 **되돌릴 수 없습니다**
- 개인정보이므로 처리가 끝나고 보관할 필요가 없는 문의는 지우는 것을 권합니다

## 4. 새 문의 알림 메일
- 누군가 문의 폼을 보내면 지정한 주소로 한국어 메일이 갑니다. 제목에 보낸 사람 이름, 본문에 이름/이메일/연락처/메시지/받은 시각이 있습니다
- 메일에서 **답장**을 누르면 받는 사람이 문의한 사람으로 채워집니다
- 보내는 주소가 `onboarding@resend.dev`(Resend 기본 주소)라 처음에는 스팸함에 들어갈 수 있습니다. 스팸함에서 "스팸 아님"으로 표시해 두세요. 스튜디오 도메인을 연결하면 바꿀 수 있습니다 (개발자)
- **메일이 안 와도 문의는 저장됩니다.** 메일은 알림일 뿐이고, 원본은 관리자 문의 목록입니다. 하루 한 번은 관리자 목록을 보는 습관을 권합니다
- 받는 주소를 바꾸려면 개발자에게 요청합니다 (`INQUIRY_NOTIFY_EMAIL`)

## 5. 서비스 한도 (무료 플랜)
이 사이트는 무료 플랜 세 곳으로 돌아갑니다. 보통의 스튜디오 사이트 방문량이면 넘지 않지만, 넘으면 이렇게 됩니다.

| 서비스 | 무엇 | 무료 한도 | 넘거나 걸리면 |
|---|---|---|---|
| Vercel Hobby (사이트) | 사진 최적화(크기/형식 변환) | 월 5,000회 | 새로 올린 사진이 안 보이고 설명 글자만 보임. 이미 본 사진은 계속 보임. 다음 달에 풀림 |
| | 전송량 | 월 100GB | Vercel 이 알림 메일을 보내고, 계속 넘으면 사이트가 멈출 수 있음 |
| | 상업적 사용 | Hobby 는 개인·비상업용만 | 실제 영업용으로 쓰면 Pro(유료)로 바꿔야 함 |
| Supabase Free (작업/문의/사진 저장, 로그인) | DB | 500MB | DB 가 읽기 전용이 되어 문의와 작업 저장이 실패함 (글자뿐이라 한참 남음) |
| | 사진 저장(Storage) | 1GB | 새 사진 올리기 실패. 긴 변 2400px 로 줄인 사진이 보통 수백 KB 라 1,000장 이상 들어감 |
| | **7일 비활성 일시정지** | 7일 동안 아무 요청이 없으면 정지 | 문의 저장, 관리자 화면, 새 작업 상세가 멈춤. 아래 "사이트가 멈췄어요" |
| Resend Free (알림 메일) | 보내기 | 월 3,000통, 하루 100통 | 그날(그달) 알림 메일만 안 감. 문의는 저장됨 |

- **일시정지는 자동으로 막아 둡니다.** Vercel 이 매일 새벽 3시(KST, 1시간 안 아무 때나)에 사이트의 `/api/keepalive` 를 불러 저장소를 한 번 읽습니다. 그래도 Supabase 에서 일시정지 관련 메일이 오면 개발자에게 알려 주세요
- 사용량 보는 곳: Vercel 대시보드 > 프로젝트 > Usage, Supabase 대시보드 > 프로젝트 > Usage (Reports), Resend 대시보드 > Usage

## 6. 자주 묻는 문제
**사이트(또는 관리자 화면)가 멈췄어요 / "잠시 문제가 생겼어요" 화면이 나와요**
대개 Supabase 가 일시정지된 경우입니다. 홈, 포트폴리오처럼 이미 만들어 둔 화면은 계속 보이지만 문의 보내기, 관리자 화면, 처음 여는 작업 상세는 실패합니다.
1. [Supabase 대시보드](https://supabase.com/dashboard) 에 로그인해 `studio-portfolio-prod` 프로젝트를 엽니다
2. "Paused" 배너가 있으면 **Resume project**(또는 Restore)를 누르고 Healthy 가 될 때까지 몇 분 기다립니다. 데이터는 그대로 남아 있습니다
3. 사이트를 새로 고칩니다. 그래도 안 되면 개발자에게 연락합니다

**문의 폼에서 "잠시 문제가 생겨 보내지 못했습니다"가 나와요**
저장소 문제입니다. 방문자가 쓴 내용은 화면에 그대로 남아 있습니다. 위와 같이 확인합니다.

**알림 메일이 안 와요**
스팸함 → 관리자 문의 목록 순서로 확인합니다. 목록에 있으면 메일만 실패한 것입니다(하루 100통 한도, 메일 서비스 장애 등). 계속되면 개발자에게 알립니다.

**저장한 작업이 홈/포트폴리오에 안 보여요**
**공개하기**가 켜져 있는지, **저장**을 눌렀는지 확인합니다. 저장하면 공개 화면이 바로 바뀝니다. 브라우저를 새로 고쳐 보세요.

**사진이 안 올라가요**
HEIC 이거나 50MB 를 넘는지, 작업에 이미 30장이 있는지 확인합니다. "로그인이 끝났습니다"가 나오면 새 탭에서 다시 로그인한 뒤 원래 화면에서 다시 올립니다 (입력한 내용은 남아 있습니다).

**사진 대신 설명 글자만 보여요**
이번 달 사진 최적화 한도(5,000회)를 넘었을 수 있습니다. 개발자에게 알려 주세요.

---

# 개발자 인수인계

## 7. 구성
| 무엇 | 어디 |
|---|---|
| 코드 | GitHub `machumstudio/studio-portfolio` (main 보호: PR + CI 필수, Rebase and merge) |
| 호스팅 | Vercel 팀 Machum Studio, 프로젝트 `machum-studio` (Hobby). 운영 주소 https://machum-studio.vercel.app |
| 운영 DB/Auth/Storage | Supabase `studio-portfolio-prod` (무료). 공개 가입·익명 로그인 꺼짐 |
| 개발 DB | Supabase 개발 프로젝트 (무료). 로컬 개발, 미리보기 배포, CI `Contract` 워크플로가 같이 씀 |
| 메일 | Resend (무료). 도메인 미인증이라 받는 주소는 계정 주인 주소만 됨 |
| Supabase 일시정지 막기 | Vercel cron `vercel.json` → `GET /api/keepalive` 매일 18:00 UTC ([ADR 0021](adr/0021-free-tier-operations.md)) |

구조와 결정은 [README](../README.md), [docs/architecture.md](architecture.md), [docs/adr](adr/README.md).

## 8. 환경 변수
값은 이 문서에 적지 않습니다. Vercel > Project > Settings > Environment Variables 에 있고, 로컬은 `.env.local`(개발) / `.env.vercel-production`(운영 DB 작업용, Next 가 자동으로 읽지 않는 이름) 에 둡니다. 둘 다 커밋 금지.

| 변수 | Production | Preview | 로컬 | 비고 |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 운영 | 개발 | 개발 | 빌드 때 번들에 들어감 → 바꾸면 재배포 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 운영 | 개발 | 개발 | `sb_publishable_...`. 공개 값(RLS 로 공개 작업 읽기만) |
| `SUPABASE_SECRET_KEY` | 운영 | 개발 | 개발 | `sb_secret_...`. 서버 전용, RLS 우회. `NEXT_PUBLIC_` 금지 |
| `RESEND_API_KEY` | ✓ | ✓ | 선택 | Sending access 키 |
| `INQUIRY_NOTIFY_EMAIL` | ✓ | ✓ | 선택 | 알림 받는 주소 |
| `INQUIRY_FROM_EMAIL` | 선택 | 선택 | 선택 | 비우면 `Machum Studio <onboarding@resend.dev>` |
| `NEXT_PUBLIC_SITE_URL` | 선택 | 없음 | 선택 | 비우면 `VERCEL_PROJECT_PRODUCTION_URL`. 도메인을 붙이면 여기에 (ADR 0018) |
| `CRON_SECRET` | 권장 | 없음 | 없음 | 16자 이상 무작위. 있으면 `/api/keepalive` 가 Vercel cron 의 Bearer 만 받음 |
| `SUPABASE_DB_URL` | 없음 | 없음 | 마이그레이션 때만 | Session pooler 주소(IPv4). 앱은 쓰지 않음 |
| `DATA_STORE` | **넣지 않음** | **넣지 않음** | e2e 용 | `memory` 면 인메모리 + 테스트 관리자 계정. 운영(`VERCEL_ENV=production`)에서는 테스트 계정이 켜지지 않음 |

GitHub Actions secrets(`Contract` 워크플로, **개발 DB**): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. 운영 값은 GitHub 에 두지 않습니다.

## 9. 배포 흐름
```
브랜치 push → PR ─┬─ GitHub Actions: CI(check, e2e) + Contract(개발 DB)
                  └─ Vercel 미리보기 배포 (개발 DB, noindex, Vercel 로그인 보호)
main 에 머지 ──────── Vercel 운영 배포 (운영 DB, 색인 허용) → https://machum-studio.vercel.app
```
- **운영 빌드는 운영 DB 를 읽습니다.** `cacheComponents` 로 홈, 포트폴리오, 작업 상세(`generateStaticParams`), sitemap 을 빌드 때 공개 작업으로 미리 그립니다
- **빌드 때 DB 가 멈춰 있거나 실패하면 빌드가 실패합니다** (`Failed to collect page data for /[locale]/work/[slug]`). 운영은 직전 배포가 그대로 계속 나갑니다. Supabase 를 Resume 한 뒤 Vercel 에서 Redeploy 합니다
- 운영 중 DB 가 멈추면: 미리 그린 화면과 캐시(1시간, 갱신 실패 시 마지막 화면 유지)는 계속 나가고, 캐시에 없는 화면(예: 처음 여는 작업 상세)은 공개 오류 화면(500), 문의 저장은 폼 오류 문구, 관리자는 오류 화면/로그인 불가
- 되돌리기: Vercel > Deployments 에서 이전 운영 배포 > **Instant Rollback** (cron 정의도 그 배포 것으로 돌아감). DB 마이그레이션은 되돌려지지 않으므로 아래 순서를 지킵니다
- 운영 DB 가 준비되지 않은 상태로 main 에 push 하면 첫 운영 빌드가 실패하거나 빈 사이트가 됩니다. 새 테이블/컬럼이 필요한 변경은 **마이그레이션을 먼저 운영에 적용한 뒤** 머지합니다

## 10. 마이그레이션 적용
SQL 은 `supabase/migrations/`. CLI 는 devDependency(`pnpm exec supabase`). CI 는 마이그레이션을 적용하지 않습니다.
1. 마이그레이션 파일 추가 + `src/infrastructure/supabase/database.ts` 타입을 손으로 맞춤 (README "Supabase 연결")
2. 개발 DB 에 적용하고 계약 테스트
   ```bash
   set -a; . ./.env.local; set +a
   pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
   pnpm exec supabase db push --db-url "$SUPABASE_DB_URL"
   pnpm test:contract
   ```
3. PR 리뷰 → **머지 직전에 운영에 적용** (앞 버전 코드와 같이 돌아도 되는 변경이어야 함: 컬럼 추가 먼저, 지우기는 다음 배포에서)
   ```bash
   set -a; . ./.env.vercel-production; set +a
   pnpm exec supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
   pnpm exec supabase db push --db-url "$SUPABASE_DB_URL"
   ```
4. 머지 → 운영 배포
- **운영에는 `pnpm test:contract` 와 `pnpm db:seed` 를 돌리지 않습니다** (테이블을 비우고 다시 채웁니다). 운영 데이터는 관리자 화면으로만 바꿉니다
- 운영 작업 셸은 끝나면 닫습니다 (운영 값이 남은 셸에서 개발 명령을 돌리지 않게)

22칸 첫 적용(2026-10-25): 마이그레이션 6개, works 시드 10개(공개 9)/사진 30장, 문의 0건. publishable 키로 RLS 확인(공개 작업만 읽힘, 비공개 작업·사진 안 보임, works/work_images/inquiries 쓰기와 문의 읽기 42501, `save_work` 42501, Storage 올리기 RLS 거부·목록 안 보임, 공개 가입·익명 로그인 꺼짐). 확인 뒤 남은 테스트 데이터 없음.

## 11. 키 교체
값이 새었거나 담당자가 바뀌면 바꿉니다. 새 키를 먼저 넣고 재배포한 뒤 옛 키를 지우면 멈추는 시간이 없습니다.
- **Supabase secret 키**: Supabase > Project Settings > API Keys > secret 키 새로 만들기 → Vercel Production(운영) / Preview(개발) 의 `SUPABASE_SECRET_KEY` 바꿈 → Redeploy → 동작 확인(문의 하나 보내 보고 지우기) → 옛 키 삭제. 로컬 env 파일과 GitHub secrets(개발)도 같이
- **Supabase publishable 키**: 같은 순서. `NEXT_PUBLIC_` 이라 번들에 들어가므로 **반드시 재배포**. 관리자 로그인도 이 키를 씀
- **DB 비밀번호**: Supabase > Database > Settings 에서 재설정 → `SUPABASE_DB_URL`(로컬)만 바꿈. 앱은 DB 비밀번호를 쓰지 않음
- **Resend 키**: Resend > API Keys 새로 만들기(Sending access) → Vercel `RESEND_API_KEY` → Redeploy → 옛 키 삭제
- **CRON_SECRET**: Vercel 값을 바꾸고 Redeploy (Vercel 이 cron 호출에 새 값을 붙임)
- Vercel 환경 변수는 바꿔도 이미 나간 배포에는 반영되지 않습니다. 항상 Redeploy

## 12. 관리자 추가 / 빼기
공개 가입은 꺼져 있어서 대시보드에서 만듭니다.
1. Supabase(운영) > Authentication > Users > **Add user** > Create new user. 이메일 + 비밀번호, Auto Confirm 켬
2. SQL Editor 에서 관리자 역할 부여 (`app_metadata` 는 사용자가 못 고침. `user_metadata` 는 보지 않음)
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
   where email = '새 관리자 이메일';
   ```
3. 새 관리자가 `/admin/login` 으로 로그인해 확인 (role 이 없으면 로그인 실패 문구가 나옴)
- 빼기: Users 에서 삭제하거나 `raw_app_meta_data - 'role'`. 삭제하면 다음 화면부터 끊기고, 역할만 빼면 이미 받은 세션은 토큰 만료(기본 1시간)까지 남을 수 있음
- 비밀번호 재설정: Users > 해당 사용자 > 비밀번호 변경 후 안전한 방법으로 전달

## 13. 일시정지 막기 확인
- Vercel > Project > Settings > Cron Jobs 에 `/api/keepalive` 가 보이는지, **View Logs** 에서 매일 200 인지
- 503 이면 저장소를 못 읽은 것 → Supabase 상태 확인
- cron 은 배달을 보장하지 않고 실패해도 다시 부르지 않습니다. 하루 한 번이라 하루 이틀 놓쳐도 7일 안에 다시 읽습니다
- 더 확실히 하려면 외부 모니터(UptimeRobot 등 무료)에 `https://machum-studio.vercel.app/api/keepalive` 를 하루 1회 이상으로 등록합니다 (`CRON_SECRET` 을 넣었다면 그 헤더를 같이)
- GitHub Actions 예약 워크플로는 쓰지 않습니다: 공개 레포에 60일 동안 활동이 없으면 예약 워크플로가 자동으로 꺼져, 운영이 조용할수록 멈추기 쉽습니다 (ADR 0021)
- 개발 Supabase 는 cron 대상이 아닙니다. 오래 쉬면 정지되고, PR 의 `Contract` 워크플로가 실패합니다. README "무료 플랜 일시정지와 Resume" 대로 깨웁니다
