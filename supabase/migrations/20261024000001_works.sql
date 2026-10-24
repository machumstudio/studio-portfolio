-- 작업과 작업 사진 (domain/works). 판단의 기준은 domain(createWork, arrangeImages)이고,
-- 여기 제약은 대시보드에서 직접 고친 행이나 잘못된 쓰기를 막는 두 번째 방어선이다 (docs/adr/0010).
-- 대표 이미지 "정확히 1개"와 순서 "0..n-1 빈칸 없음"은 행 하나로 검사할 수 없어 domain 이 읽을 때 본다.

create table public.works (
  -- 관리자 주소와 시드에서 쓰는 사람이 읽는 id (예: work-01)
  id text primary key check (id <> '' and id = btrim(id)),
  -- /work/[slug]. domain/works/slug.ts 와 같은 형식
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_ko text not null check (btrim(title_ko) <> ''),
  title_en text not null check (btrim(title_en) <> ''),
  -- domain/works/work.ts workCategories
  category text not null check (category in ('portrait', 'events', 'commercial')),
  -- 촬영 연월 YYYY-MM. 같은 길이의 0 채운 문자열이라 문자열 정렬이 곧 날짜 순서다
  year_month text not null check (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.work_images (
  work_id text not null references public.works (id) on delete cascade,
  -- 보여 줄 순서 0..n-1. 작업 안에서 겹치지 않는다
  sort_order integer not null check (sort_order >= 0),
  src text not null check (src <> ''),
  alt_ko text not null default '',
  alt_en text not null default '',
  is_cover boolean not null default false,
  primary key (work_id, sort_order)
);

-- 대표 이미지는 작업마다 최대 1개. 대표를 사진 행의 표시로 두면 "목록 밖의 대표"가 생길 수 없다
create unique index work_images_one_cover_per_work on public.work_images (work_id) where is_cover;

-- RLS: publishable 키(anon)는 공개 작업과 그 사진만 읽는다. 쓰기는 secret 키(service_role, RLS 우회)만
alter table public.works enable row level security;
alter table public.work_images enable row level security;

create policy "공개 작업은 누구나 읽는다" on public.works
  for select to anon, authenticated
  using (published);

create policy "공개 작업의 사진은 누구나 읽는다" on public.work_images
  for select to anon, authenticated
  using (exists (select 1 from public.works w where w.id = work_id and w.published));

-- 정책 위에 권한도 좁힌다: 정책이 실수로 넓어져도 쓰기와 truncate(RLS 를 거치지 않는다)는 막힌다
revoke all on public.works, public.work_images from anon, authenticated;
grant select on public.works, public.work_images to anon, authenticated;
grant all on public.works, public.work_images to service_role;
