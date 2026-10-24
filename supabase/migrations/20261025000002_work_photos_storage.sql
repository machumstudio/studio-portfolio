-- 작업 사진 Storage 버킷 (18칸, docs/adr/0014).
-- - 공개 버킷: 사진 주소(/storage/v1/object/public/work-photos/...)는 누구나 읽는다. 공개 사이트와 next/image 가
--   서명 없이 캐시할 수 있다. 파일 이름은 서버가 정한 UUID 라 주소를 모르면 비공개 작업의 사진을 찾을 수 없고,
--   목록 보기(list)는 아래 정책대로 관리자만 된다
-- - 쓰기(올리기, 지우기)와 목록은 관리자 세션만 (public.is_admin(), docs/adr/0012). 덮어쓰기(update)는 아무도 못 한다
-- - 한도와 형식은 application/works/photo-limits.ts 와 같다: 브라우저가 줄인 파일 10MB, jpeg/png/webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work-photos', 'work-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "관리자는 작업 사진 목록을 본다" on storage.objects
  for select to authenticated
  using (bucket_id = 'work-photos' and (select public.is_admin()));

-- 서명 업로드 주소(createSignedUploadUrl)를 만들 때 이 정책을 본다. 주소로 올릴 때는 그 경로 하나만 쓸 수 있다
create policy "관리자는 작업 사진을 올린다" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'work-photos' and (select public.is_admin()));

create policy "관리자는 작업 사진을 지운다" on storage.objects
  for delete to authenticated
  using (bucket_id = 'work-photos' and (select public.is_admin()));
