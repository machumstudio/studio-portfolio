-- 작업의 마지막 저장 시각 (20칸 sitemap 의 lastmod). 시각은 저장하는 유스케이스가 Clock 에서 받아 넣는다
-- (문의 상태 시각과 같은 방식, docs/adr/0008). 이미 있는 행은 이 마이그레이션을 적용한 때로 채운다
alter table public.works
  add column updated_at timestamptz not null default now();

-- save_work 가 updated_at 도 받아서 쓰게 바꾼다. 나머지는 20261025000001_save_work.sql 과 같다
create or replace function public.save_work(work jsonb, images jsonb)
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

  insert into public.works (id, slug, title_ko, title_en, category, year_month, published, updated_at)
  values (work_row.id, work_row.slug, work_row.title_ko, work_row.title_en,
          work_row.category, work_row.year_month, work_row.published,
          coalesce(work_row.updated_at, now()))
  on conflict (id) do update set
    slug = excluded.slug,
    title_ko = excluded.title_ko,
    title_en = excluded.title_en,
    category = excluded.category,
    year_month = excluded.year_month,
    published = excluded.published,
    updated_at = excluded.updated_at;

  delete from public.work_images where work_id = work_row.id;
  insert into public.work_images (work_id, sort_order, src, alt_ko, alt_en, is_cover)
  select work_row.id, i.sort_order, i.src, i.alt_ko, i.alt_en, i.is_cover
  from jsonb_populate_recordset(null::public.work_images, images) i;
end;
$$;
