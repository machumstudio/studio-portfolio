-- 문의 (domain/inquiry). 칸 한도는 domain/inquiry/fields.ts inquiryLimits 와 같다.
-- 판단의 기준은 domain 이고 여기 제약은 두 번째 방어선이다 (docs/adr/0010).
-- 길이는 char_length(코드 포인트 수)로 domain 의 Array.from(value).length 와 같게 센다

create table public.inquiries (
  -- infrastructure/inquiry/system.ts 의 UUID v4
  id uuid primary key,
  first_name text not null check (btrim(first_name) <> '' and char_length(first_name) <= 50),
  last_name text not null check (btrim(last_name) <> '' and char_length(last_name) <= 50),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+$'),
  -- 선택 항목. 입력하지 않으면 null (빈 문자열로 두지 않는다)
  phone text check (phone is null or (btrim(phone) <> '' and char_length(phone) <= 20)),
  message text not null check (btrim(message) <> '' and char_length(message) <= 2000),
  received_at timestamptz not null,
  -- 상태와 그 상태가 된 시각 (docs/adr/0008). new 의 시각은 received_at
  status text not null default 'new' check (status in ('new', 'read', 'done')),
  status_changed_at timestamptz,
  constraint inquiries_status_changed_at_only_after_new
    check ((status = 'new') = (status_changed_at is null))
);

-- 19칸 관리자 목록은 최신순
create index inquiries_received_at_idx on public.inquiries (received_at desc);

-- RLS: 정책을 두지 않는다. publishable 키(anon/authenticated)로는 읽기도 쓰기도 안 되고,
-- 서버의 secret 키(service_role, RLS 우회)만 쓴다. 문의 제출도 서버 액션이 secret 키로 저장한다
alter table public.inquiries enable row level security;

revoke all on public.inquiries from anon, authenticated;
grant all on public.inquiries to service_role;
