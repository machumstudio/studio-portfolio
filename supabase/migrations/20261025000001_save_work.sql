-- 작업 저장 (18칸 관리자). 작업 행과 사진 행을 한 트랜잭션으로 바꾼다.
-- PostgREST 요청은 하나씩 커밋되어서, 사진을 지우고 넣는 사이에 실패하면 사진 없는 작업이 남고
-- 공개 목록 전체가 복원에 실패한다 (docs/adr/0010). 함수 하나로 묶으면 실패할 때 통째로 되돌아간다.
-- security invoker: 부른 세션의 권한과 RLS 정책을 그대로 받는다 (관리자 세션만 쓰기, docs/adr/0012)

create function public.save_work(work jsonb, images jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  work_row public.works;
  image_count integer;
begin
  work_row := jsonb_populate_record(null::public.works, work);

  -- 사진 규칙의 두 번째 방어선 (기준은 domain/works/images.ts arrangeImages).
  -- 행 하나로 검사할 수 없는 "대표 정확히 1개", "순서 0..n-1 빈칸 없음"을 저장할 때 본다
  select count(*) into image_count from jsonb_array_elements(images);
  if image_count = 0 then
    raise exception '작업 %: 사진이 없다', work_row.id using errcode = '23514';
  end if;
  if (select count(*) from jsonb_array_elements(images) i where (i ->> 'is_cover')::boolean) <> 1 then
    raise exception '작업 %: 대표 사진이 정확히 1개가 아니다', work_row.id using errcode = '23514';
  end if;
  if (select array_agg((i ->> 'sort_order')::integer order by (i ->> 'sort_order')::integer)
        from jsonb_array_elements(images) i)
     <> (select array_agg(n order by n) from generate_series(0, image_count - 1) n) then
    raise exception '작업 %: 사진 순서가 0..n-1 이 아니다', work_row.id using errcode = '23514';
  end if;

  insert into public.works (id, slug, title_ko, title_en, category, year_month, published)
  values (work_row.id, work_row.slug, work_row.title_ko, work_row.title_en,
          work_row.category, work_row.year_month, work_row.published)
  on conflict (id) do update set
    slug = excluded.slug,
    title_ko = excluded.title_ko,
    title_en = excluded.title_en,
    category = excluded.category,
    year_month = excluded.year_month,
    published = excluded.published;

  delete from public.work_images where work_id = work_row.id;
  insert into public.work_images (work_id, sort_order, src, alt_ko, alt_en, is_cover)
  select work_row.id, i.sort_order, i.src, i.alt_ko, i.alt_en, i.is_cover
  from jsonb_populate_recordset(null::public.work_images, images) i;
end;
$$;

revoke all on function public.save_work(jsonb, jsonb) from public, anon;
grant execute on function public.save_work(jsonb, jsonb) to authenticated, service_role;
