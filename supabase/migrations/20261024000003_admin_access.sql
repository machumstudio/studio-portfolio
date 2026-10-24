-- 관리자 권한 (docs/adr/0012). 관리자 화면(18칸 작업, 19칸 문의)은 secret 키가 아니라
-- 로그인한 관리자 세션(authenticated 역할 + JWT)으로 테이블을 쓴다. 서버 액션의 권한 확인을 빠뜨려도
-- DB 가 관리자가 아닌 세션을 막는 두 번째 방어선이다.
-- 관리자 판정은 domain/admin-auth/admin.ts authorizeAdmin 과 같다: app_metadata.role 이 정확히 'admin'.
-- app_metadata 는 service_role(대시보드, admin API)만 고칠 수 있다. user_metadata 는 사용자가 고칠 수 있어 쓰지 않는다

create function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 정책 안의 (select ...) 는 행마다가 아니라 쿼리마다 한 번 계산하게 한다

-- 작업: 관리자는 비공개를 포함해 읽고, 추가/수정/삭제한다
create policy "관리자는 모든 작업을 읽는다" on public.works
  for select to authenticated
  using ((select public.is_admin()));
create policy "관리자는 작업을 추가한다" on public.works
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "관리자는 작업을 고친다" on public.works
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "관리자는 작업을 지운다" on public.works
  for delete to authenticated
  using ((select public.is_admin()));

create policy "관리자는 모든 사진을 읽는다" on public.work_images
  for select to authenticated
  using ((select public.is_admin()));
create policy "관리자는 사진을 추가한다" on public.work_images
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "관리자는 사진을 고친다" on public.work_images
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "관리자는 사진을 지운다" on public.work_images
  for delete to authenticated
  using ((select public.is_admin()));

-- 문의: 관리자는 읽고, 상태를 바꾸고, 지운다. 새 문의 저장은 지금처럼 서버의 secret 키만 한다 (insert 권한 없음)
create policy "관리자는 문의를 읽는다" on public.inquiries
  for select to authenticated
  using ((select public.is_admin()));
create policy "관리자는 문의를 고친다" on public.inquiries
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "관리자는 문의를 지운다" on public.inquiries
  for delete to authenticated
  using ((select public.is_admin()));

-- 권한: authenticated 에 필요한 것만 연다. 행은 위 정책이 거른다 (관리자가 아니면 0행).
-- anon 은 그대로 공개 작업 읽기만, truncate(RLS 를 거치지 않는다)는 여전히 아무에게도 주지 않는다
grant insert, update, delete on public.works, public.work_images to authenticated;
grant select, update, delete on public.inquiries to authenticated;
