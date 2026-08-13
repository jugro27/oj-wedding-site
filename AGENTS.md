<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project

Wedding website built with Next.js and Supabase.

# Database

Canonical database definitions are located in:

supabase/schema.sql
supabase/functions.sql

Do not invent database columns.
Update these files whenever database structure changes.

# RSVP

Invitations are looked up using the Supabase
find_invitation() RPC.

Existing RSVP data should be returned when an
invitation has already responded.

# Development

Run:

npm.cmd run dev

before browser testing.

# Testing

Use Playwright to test RSVP workflows after
modifying RSVP functionality.