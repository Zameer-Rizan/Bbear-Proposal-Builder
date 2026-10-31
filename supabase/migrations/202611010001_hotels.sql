begin;
-- Separate private hotel records. Existing proposals and staff approvals are unchanged.
create table public.bbear_hotels(id uuid primary key,version integer not null,body jsonb not null);
create table public.bbear_hotel_contracts(id uuid primary key,hotel_id uuid not null references public.bbear_hotels(id),sha text not null unique,version integer not null,body jsonb not null);
create index on public.bbear_hotel_contracts(hotel_id);
create table public.bbear_hotel_history(kind text not null,id uuid not null,version integer not null,body jsonb not null,changed_by uuid,changed_at timestamptz not null default now(),primary key(kind,id,version));
alter table public.bbear_hotels enable row level security;
alter table public.bbear_hotel_contracts enable row level security;
alter table public.bbear_hotel_history enable row level security;
revoke all on public.bbear_hotels,public.bbear_hotel_contracts,public.bbear_hotel_history from anon,authenticated;
grant select on public.bbear_hotels,public.bbear_hotel_contracts,public.bbear_hotel_history to authenticated;
create policy staff_read on public.bbear_hotels for select to authenticated using(exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create policy staff_read on public.bbear_hotel_contracts for select to authenticated using(exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create policy staff_read on public.bbear_hotel_history for select to authenticated using(exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create function public.bbear_save_hotel_record(record_kind text,record_body jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; record_id uuid; old_version integer; changed integer;
begin
 if not exists(select 1 from public.bbear_staff where user_id=auth.uid()) then raise exception 'Staff access required'; end if;
 record_id=(record_body->>'id')::uuid; old_version=(record_body->>'version')::integer;
 if old_version is null or old_version<0 or jsonb_typeof(record_body)<>'object' then raise exception 'Invalid record'; end if;
 result=record_body||jsonb_build_object('version',old_version+1,'updated',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 if record_kind='hotel' then
  if old_version=0 then insert into public.bbear_hotels values(record_id,1,result) on conflict do nothing;
  else update public.bbear_hotels set version=old_version+1,body=result where id=record_id and version=old_version; end if;
 elsif record_kind='contract' then
  if old_version=0 then insert into public.bbear_hotel_contracts values(record_id,(result->>'hotelId')::uuid,result->>'sha',1,result) on conflict do nothing;
  else update public.bbear_hotel_contracts set hotel_id=(result->>'hotelId')::uuid,sha=result->>'sha',version=old_version+1,body=result where id=record_id and version=old_version; end if;
 else raise exception 'Invalid record type'; end if;
 get diagnostics changed=row_count;if changed<>1 then raise exception 'CONFLICT'; end if;
 insert into public.bbear_hotel_history(kind,id,version,body,changed_by) values(record_kind,record_id,old_version+1,result,auth.uid());
 return result;
end $$;
revoke all on function public.bbear_save_hotel_record(text,jsonb) from public,anon;
grant execute on function public.bbear_save_hotel_record(text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bbear-contracts','bbear-contracts',false,4194304,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/json']);
create policy hotel_contract_read on storage.objects for select to authenticated using(bucket_id='bbear-contracts' and exists(select 1 from public.bbear_staff where user_id=auth.uid()));
create policy hotel_contract_insert on storage.objects for insert to authenticated with check(bucket_id='bbear-contracts' and exists(select 1 from public.bbear_staff where user_id=auth.uid()));
commit;
