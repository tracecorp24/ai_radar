insert into storage.buckets (id, name, public) values ('paper-assets', 'paper-assets', false) on conflict (id) do nothing;

create policy "Authenticated users can read paper assets" on storage.objects
  for select to authenticated using (bucket_id = 'paper-assets');
