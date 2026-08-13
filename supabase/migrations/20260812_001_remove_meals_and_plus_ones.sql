-- Remove RSVP concepts that are no longer part of the wedding plan.
alter table public.guests
    drop column if exists plus_one;

alter table public.rsvps
    drop column if exists meal_choice;

create or replace function public.find_invitation(p_invite_code text)
returns json
language sql
security definer
set search_path = ''
as $$
    select json_build_object(
        'household_id', h.id,
        'household_name', h.household_name,
        'guests', (
            select coalesce(
                json_agg(
                    json_build_object(
                        'id', g.id,
                        'first_name', g.first_name,
                        'last_name', g.last_name,
                        'rsvp', case when r.id is null then null else
                            json_build_object(
                                'attending', r.attending,
                                'dietary_restrictions', r.dietary_restrictions,
                                'song_request', r.song_request,
                                'bus_signup', r.bus_signup,
                                'submitted_at', r.submitted_at
                            )
                        end
                    ) order by g.first_name, g.last_name
                ),
                '[]'::json
            )
            from public.guests g
            left join public.rsvps r on r.guest_id = g.id
            where g.household_id = h.id and g.invited = true
        )
    )
    from public.households h
    where upper(h.invite_code) = upper(trim(p_invite_code));
$$;

create or replace function public.submit_rsvp(
    p_invite_code text,
    p_responses jsonb
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_household_id uuid;
    v_response jsonb;
    v_guest_id uuid;
    v_attending boolean;
    v_dietary_restrictions text;
    v_song_request text;
    v_bus_signup boolean;
begin
    select h.id into v_household_id
    from public.households h
    where upper(h.invite_code) = upper(trim(p_invite_code));

    if v_household_id is null then
        raise exception 'Invalid invitation code';
    end if;

    if jsonb_typeof(p_responses) <> 'array'
        or jsonb_array_length(p_responses) = 0 then
        raise exception 'Responses must be a non-empty JSON array';
    end if;

    if jsonb_array_length(p_responses) <> (
        select count(*) from public.guests g
        where g.household_id = v_household_id and g.invited = true
    ) then
        raise exception 'A response is required for every invited guest';
    end if;

    if (select count(distinct response ->> 'guest_id')
        from jsonb_array_elements(p_responses) response)
        <> jsonb_array_length(p_responses) then
        raise exception 'Duplicate guest responses are not allowed';
    end if;

    for v_response in select value from jsonb_array_elements(p_responses)
    loop
        v_guest_id := (v_response ->> 'guest_id')::uuid;
        v_attending := (v_response ->> 'attending')::boolean;
        v_dietary_restrictions := nullif(trim(v_response ->> 'dietary_restrictions'), '');
        v_song_request := nullif(trim(v_response ->> 'song_request'), '');
        v_bus_signup := coalesce((v_response ->> 'bus_signup')::boolean, false);

        if v_guest_id is null or v_attending is null then
            raise exception 'Guest ID and attendance are required';
        end if;

        if length(v_dietary_restrictions) > 500 or length(v_song_request) > 500 then
            raise exception 'Text responses must be 500 characters or fewer';
        end if;

        if not exists (
            select 1 from public.guests g
            where g.id = v_guest_id
              and g.household_id = v_household_id
              and g.invited = true
        ) then
            raise exception 'Guest does not belong to this invitation';
        end if;

        if not v_attending then
            v_dietary_restrictions := null;
            v_song_request := null;
            v_bus_signup := false;
        end if;

        insert into public.rsvps (
            guest_id, attending, dietary_restrictions, song_request,
            bus_signup, submitted_at, updated_at
        ) values (
            v_guest_id, v_attending, v_dietary_restrictions, v_song_request,
            v_bus_signup, now(), now()
        )
        on conflict (guest_id) do update set
            attending = excluded.attending,
            dietary_restrictions = excluded.dietary_restrictions,
            song_request = excluded.song_request,
            bus_signup = excluded.bus_signup,
            submitted_at = excluded.submitted_at,
            updated_at = excluded.updated_at;
    end loop;

    return json_build_object('success', true);
end;
$$;

revoke execute on function public.find_invitation(text) from public, authenticated;
grant execute on function public.find_invitation(text) to anon;

revoke execute on function public.submit_rsvp(text, jsonb) from public, authenticated;
grant execute on function public.submit_rsvp(text, jsonb) to anon;
