# Questions for Chris

Running list of things Chris (project owner) needs to answer.
Confirmed dates: **first event 2026-05-28**, **public launch 2026-06-11**.

## Urgent — before May 28 (first event)

- [ ] **Final team roster — URGENT.** Right now we seed 30 placeholder teams
      named "Team 01" … "Team 30." Without real names, the first event's
      admin approvals get attributed to placeholder labels. Need names ASAP;
      logos can follow later.
- [ ] **Admin allowlist additions.** Chris's email (and anyone else who
      should be able to approve submissions). Without this, only Alex can
      approve. One SQL `INSERT` per email.

## Before June 11 (public launch)

- [ ] **Official scoring rubric.** Current placeholder values per category
      (`is_placeholder=true` shows an "awaiting official rubric" banner in
      `/admin/scoring`):
      - Volunteering: 10 pts/hour
      - Creator Content: 5 pts/post
      - Community Events: 100 pts/event
      - Tourism & Check-ins: 2 pts/check-in
      - Mentorship: 15 pts/mentorship-hour
      - Donations & Support: 0.1 pts/dollar (= 1 pt per $10)
- [ ] **Confirm the 6 categories.** Seeded from the infographic donut. The
      "what teams compete on" sidebar lists 8 different items — confirm the
      right set.
- [ ] **Team logos.** `teams.logo_url` is in the schema, nullable. Hand over
      logos when ready; otherwise leaderboard renders text-only.

## Nice-to-have (can wait)

- [ ] **Anchor location tie-in.** Infographic mentions South Houston Tennis
      Academy, Pitch 25, The Shop. Should submissions reference an anchor
      location? Not in v1 schema.
- [ ] **Domain ownership transfer.** Alex is registering the domain on his
      card. If Chris wants long-term ownership, transfer can happen later.

## Resolved

- [x] **Launch date** — public launch 2026-06-11, first event 2026-05-28.
- [x] **Custom domain** — confirmed needed; Alex will register.
