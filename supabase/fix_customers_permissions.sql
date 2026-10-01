-- Run this in the Supabase SQL Editor for the project used by this app.
-- It grants customer table access only to authenticated application users.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;

-- Allow inserts to use the table's generated ID sequence when it has one.
do $$
declare
  customers_id_sequence text;
begin
  customers_id_sequence := pg_get_serial_sequence('public.customers', 'id');

  if customers_id_sequence is not null then
    execute format(
      'grant usage, select on sequence %s to authenticated',
      customers_id_sequence
    );
  end if;
end
$$;
