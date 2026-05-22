# Questions for Chris

Running list of things Chris (project owner) needs to answer before/around launch.
Nothing here blocks the v1 build — placeholders are in place — but real answers
let us flip the dashboard from "demo" to "real."

## Pre-launch (need before going public)

- [ ] **Final team roster.** Right now we seed 30 placeholder teams named
      "Team 01" … "Team 30." Need the real names + ideally logos.
- [ ] **Official scoring rubric.** Current placeholder values per category
      (`is_placeholder=true` flips the "awaiting official rubric" banner in
      `/admin/scoring`):
      - Volunteering: 10 pts/hour
      - Creator Content: 5 pts/post
      - Community Events: 100 pts/event
      - Tourism & Check-ins: 2 pts/check-in
      - Mentorship: 15 pts/mentorship-hour
      - Donations & Support: 0.1 pts/dollar
- [ ] **Launch date.** Is there a specific date the public URL needs to be
      shareable? Drives Day 6–7 polish priorities.
- [ ] **Admin allowlist additions.** Chris's email + anyone else who should
      be able to approve submissions. Added via SQL or `/admin/admins`
      (latter ships post-v1 if needed).

## Nice-to-have (post-launch)

- [ ] **Custom domain.** Currently planning a `vercel.app` subdomain. Switch
      to a custom domain whenever Chris wants — needs DNS access.
- [ ] **Category list.** We seeded the 6 from the infographic. Confirm these
      are the right 6, or swap to the 8 "what teams compete on" list.
- [ ] **Team logos.** `teams.logo_url` is in the schema but nullable. Hand
      over logos when ready; otherwise leaderboard renders text-only.
- [ ] **Anchor location tie-in.** Infographic mentions South Houston Tennis
      Academy, Pitch 25, The Shop. Should submissions reference an anchor
      location? Not in v1 schema.
