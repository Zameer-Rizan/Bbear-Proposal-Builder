begin;
-- No public signup grants staff access. Add approved Auth user IDs manually.
create table public.bbear_staff(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.bbear_staff enable row level security;
revoke all on public.bbear_staff from anon, authenticated;
grant select on public.bbear_staff to authenticated;
create policy staff_self on public.bbear_staff for select to authenticated using(user_id=auth.uid());
create table public.bbear_proposals(id text primary key, version integer not null check(version>0), body jsonb not null);
create table public.bbear_revisions(id text not null, version integer not null, body jsonb not null, primary key(id,version));
alter table public.bbear_proposals enable row level security;
alter table public.bbear_revisions enable row level security;
revoke all on public.bbear_proposals,public.bbear_revisions from anon,authenticated;
grant select on public.bbear_proposals,public.bbear_revisions to authenticated;
create policy staff_read on public.bbear_proposals for select to authenticated using(exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create policy staff_read on public.bbear_revisions for select to authenticated using(exists(select 1 from public.bbear_staff where user_id=auth.uid()));
-- One transaction for the proposal and revision; stale saves cannot overwrite a newer version.
create function public.bbear_save_proposal(proposal jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; old_version integer; proposal_id text; changed integer;
begin
 if not exists(select 1 from public.bbear_staff where user_id=auth.uid()) then raise exception 'Staff access required'; end if;
 proposal_id=proposal->>'id'; old_version=(proposal->>'version')::integer;
 if proposal_id is null or length(proposal_id) not between 1 and 128 or old_version is null or old_version<0 or jsonb_typeof(proposal)<>'object' then raise exception 'Invalid proposal'; end if;
 result=proposal||jsonb_build_object('version',old_version+1,'updated',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 if old_version=0 then
  insert into public.bbear_proposals values(proposal_id,1,result) on conflict do nothing;
 else
  update public.bbear_proposals set version=old_version+1,body=result where id=proposal_id and version=old_version;
 end if;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'CONFLICT'; end if;
 insert into public.bbear_revisions values(proposal_id,old_version+1,result);
 return result;
end $$;
revoke all on function public.bbear_save_proposal(jsonb) from public,anon;
grant execute on function public.bbear_save_proposal(jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bbear-private','bbear-private',false,52428800,array['image/jpeg','application/pdf']);
create policy bbear_files_read on storage.objects for select to authenticated using(bucket_id='bbear-private' and exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create policy bbear_files_insert on storage.objects for insert to authenticated with check(bucket_id='bbear-private' and exists(select 1 from public.bbear_staff where user_id=auth.uid()));
commit;
