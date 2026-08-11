# Wedding Website Supabase Backend

This folder contains the database schema, RPC functions, migrations, and development seed data for the wedding website.

## Purpose

Supabase provides the backend for:

* wedding households / invitations
* invited guests
* RSVP responses
* meal selections
* dietary restrictions
* song requests
* bus transportation signups

The guest-facing website uses controlled Postgres RPC functions rather than direct browser access to the underlying tables.

---

## Folder Structure

```text
supabase/
├── migrations/
│   └── ...
├── schema.sql
├── functions.sql
├── seed.sql
└── README.md
```

### `schema.sql`

Current-state snapshot of the database schema.

It defines:

* `public.households`
* `public.guests`
* `public.rsvps`
* foreign keys
* indexes
* Row Level Security
* direct table privilege restrictions

Use this file to quickly understand what the database looks like now.

Do not treat this file as a migration to rerun against an already-created database.

---

### `functions.sql`

Current-state snapshot of the application-facing Postgres functions.

Currently includes:

* `public.find_invitation(p_invite_code text)`
* `public.submit_rsvp(p_invite_code text, p_responses jsonb)`

These functions form the guest-facing API boundary.

---

### `migrations/`

Authoritative history of database changes.

New schema changes should be added as migration files instead of only modifying the current-state snapshots.

Example:

```text
supabase/migrations/
├── 20260811_001_initial_schema.sql
├── 20260811_002_add_bus_signup.sql
└── 20260812_001_add_guest_email.sql
```

After creating a migration, update `schema.sql` and/or `functions.sql` so they continue to represent the current database state.

---

### `seed.sql`

Development-only test data.

Use fake households, guests, and RSVP data here.

Do not commit real wedding guest information, real invitation codes, addresses, or other private guest data.

Example test invitation:

```text
Invitation code: TEST123
Household: The Smith Family
```

---

# Data Model

## `households`

Represents one invitation or household.

Typical relationship:

```text
The Smith Family
├── Sarah Smith
├── John Smith
└── Emily Smith
```

Important fields include:

* `id`
* `household_name`
* `invite_code`
* mailing address fields
* `created_at`

`invite_code` is unique and is used by guests to locate their invitation.

---

## `guests`

Represents one invited person.

Each guest belongs to exactly one household through:

```text
guests.household_id
    ->
households.id
```

Important fields include:

* `id`
* `household_id`
* `first_name`
* `last_name`
* `invited`
* `plus_one`
* `created_at`

The current `plus_one` field indicates plus-one eligibility. Plus-one workflow may be expanded later.

---

## `rsvps`

Represents one RSVP response per guest.

Each RSVP belongs to one guest through:

```text
rsvps.guest_id
    ->
guests.id
```

`guest_id` is unique, so each guest can have at most one RSVP row.

If a guest changes their RSVP, the existing row is updated rather than duplicated.

Important fields include:

* `guest_id`
* `attending`
* `meal_choice`
* `dietary_restrictions`
* `song_request`
* `bus_signup`
* `submitted_at`
* `updated_at`

---

# Guest-Facing Access Pattern

The browser should not directly query or modify:

```text
public.households
public.guests
public.rsvps
```

Do not replace the RPC pattern with direct client-side queries such as:

```ts
supabase.from("guests").select("*")
```

or:

```ts
supabase.from("rsvps").insert(...)
```

without intentionally redesigning the security model.

Guest-facing operations currently go through these RPC functions:

```text
find_invitation()
submit_rsvp()
```

---

# `find_invitation()`

Called by the website when a guest enters an invitation code.

Example:

```ts
supabase.rpc("find_invitation", {
  p_invite_code: inviteCode
})
```

It returns one household and its invited guests.

It also returns an existing RSVP for each guest when one exists.

Conceptually:

```text
Invitation code
      ↓
find_invitation()
      ↓
household
      ↓
guests
      ↓
existing RSVP data
```

Example response shape:

```json
{
  "household_id": "uuid",
  "household_name": "The Smith Family",
  "guests": [
    {
      "id": "uuid",
      "first_name": "Sarah",
      "last_name": "Smith",
      "plus_one": false,
      "rsvp": {
        "attending": true,
        "meal_choice": "Chicken",
        "dietary_restrictions": null,
        "song_request": "Dancing Queen",
        "bus_signup": true,
        "submitted_at": "2026-08-11T..."
      }
    }
  ]
}
```

For guests who have never submitted an RSVP:

```json
"rsvp": null
```

---

# `submit_rsvp()`

Called when a household submits or updates RSVP responses.

Example:

```ts
supabase.rpc("submit_rsvp", {
  p_invite_code: inviteCode,
  p_responses: responses
})
```

Example payload:

```json
[
  {
    "guest_id": "uuid",
    "attending": true,
    "meal_choice": "Chicken",
    "dietary_restrictions": "Gluten free",
    "song_request": "Dancing Queen",
    "bus_signup": true
  }
]
```

The function:

1. resolves the household from the invitation code
2. verifies every submitted guest belongs to that household
3. rejects guests that do not belong to the invitation
4. inserts new RSVP rows
5. updates existing RSVP rows
6. clears attendance-only fields when a guest declines

The current application retains `song_request` even when a guest declines.

---

# Security Model

Row Level Security is enabled on all guest-related tables.

Direct table privileges for `anon` and `authenticated` users are intentionally restricted.

Guest access is exposed through narrowly scoped `security definer` functions.

The functions use:

```sql
set search_path = ''
```

and fully qualified table names such as:

```sql
public.guests
public.rsvps
```

Do not casually change these functions to expose broad table access.

## Important

The Supabase publishable key is safe to use in the browser only because authorization is enforced by database permissions, RLS, and controlled RPC functions.

Never expose a Supabase secret key or service-role key to client-side code.

---

# RSVP Behavior

Current workflow:

```text
Guest enters invitation code
        ↓
find_invitation()
        ↓
Household and guests returned
        ↓
Existing RSVP answers prefilled if available
        ↓
Guest edits responses
        ↓
submit_rsvp()
        ↓
Existing RSVP rows inserted or updated
```

Current RSVP fields per guest:

```text
Attending
Meal choice
Dietary restrictions
Bus signup
Song request
```

`bus_signup` is per guest so transportation headcounts can be calculated accurately.

---

# Current Application Assumptions

The frontend currently assumes:

* invitation codes are case-insensitive
* one RSVP row exists per guest
* RSVP responses can be updated later
* guests who decline do not keep meal selections
* guests who decline are not signed up for the bus
* song requests are currently allowed regardless of attendance status
* unnamed plus-one handling has not yet been fully implemented

If any of these behaviors change, update both the frontend and Supabase functions together where necessary.

---

# Development Rules

When changing the database:

1. create a migration
2. apply/test the migration
3. update `schema.sql` if the schema changed
4. update `functions.sql` if RPC behavior changed
5. update this README if architecture or behavior changed

Do not use real guest data in committed seed files.

Do not commit secret Supabase keys or `.env.local`.

---

# Guidance for Codex

When modifying this project:

* Treat `schema.sql` as the current schema snapshot.
* Treat `functions.sql` as the current RPC snapshot.
* Treat `migrations/` as the authoritative schema-change history.
* Preserve the RPC-based guest access model unless explicitly instructed otherwise.
* Do not introduce direct anonymous browser access to guest or RSVP tables without intentionally redesigning the security model.
* Keep frontend RSVP behavior and database validation consistent.
* Prefer migrations for database changes rather than editing the live database manually.
* Keep committed seed data fake and non-sensitive.
