begin;

-- Stop before changing anything if the current hotel list already contains
-- names that differ only by letter case or repeated/outer spaces.
do $$
begin
  if exists (
    select 1
    from public.bbear_hotels
    where nullif(trim(body->>'name'), '') is not null
    group by lower(regexp_replace(trim(body->>'name'), '\s+', ' ', 'g'))
    having count(*) > 1
  ) then
    raise exception 'Duplicate hotel names need a staff review before this migration can be applied.';
  end if;
end $$;

create unique index if not exists bbear_hotels_normalized_name_unique
  on public.bbear_hotels ((lower(regexp_replace(trim(body->>'name'), '\s+', ' ', 'g'))))
  where nullif(trim(body->>'name'), '') is not null;

commit;
