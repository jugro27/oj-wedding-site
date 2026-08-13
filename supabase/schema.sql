-- ============================================================
-- Wedding Website Database Schema
-- Current-state snapshot
-- ============================================================

-- ------------------------------------------------------------
-- HOUSEHOLDS
-- One row per invitation / household.
-- Example:
--   The Smith Family
--   Invite code: TEST123
-- ------------------------------------------------------------

create table public.households (
    id uuid primary key default gen_random_uuid(),

    household_name text not null,
    invite_code text not null unique,

    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    zip_code text,

    created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- GUESTS
-- One row per invited person.
-- Each guest belongs to one household.
-- ------------------------------------------------------------

create table public.guests (
    id uuid primary key default gen_random_uuid(),

    household_id uuid not null
        references public.households(id)
        on delete cascade,

    first_name text not null,
    last_name text not null,

    invited boolean not null default true,

    created_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- RSVPS
-- One RSVP row per guest.
-- guest_id is UNIQUE so an existing RSVP can be updated
-- rather than creating duplicate RSVP rows.
-- ------------------------------------------------------------

create table public.rsvps (
    id uuid primary key default gen_random_uuid(),

    guest_id uuid not null unique
        references public.guests(id)
        on delete cascade,

    attending boolean,

    dietary_restrictions text,
    song_request text,

    bus_signup boolean not null default false,

    submitted_at timestamptz,
    updated_at timestamptz not null default now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.households enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;


-- ============================================================
-- DATA API ACCESS
-- ============================================================
--
-- The browser should NOT receive direct access to these tables.
-- Guest-facing operations are handled through controlled
-- Postgres RPC functions such as:
--
--   public.find_invitation(...)
--   public.submit_rsvp(...)
--
-- Therefore we explicitly revoke direct table privileges from
-- anonymous and authenticated API users.
-- ============================================================

revoke all
on table public.households
from anon, authenticated;

revoke all
on table public.guests
from anon, authenticated;

revoke all
on table public.rsvps
from anon, authenticated;


-- ============================================================
-- INDEXES
-- ============================================================
--
-- PostgreSQL automatically creates indexes for:
--
--   households.id
--   households.invite_code
--   guests.id
--   rsvps.id
--   rsvps.guest_id
--
-- because those columns are PRIMARY KEY or UNIQUE.
--
-- Foreign keys do not automatically receive an index, so add
-- one for household_id because invitation lookup frequently
-- finds guests by household.
-- ============================================================

create index idx_guests_household_id
    on public.guests(household_id);
