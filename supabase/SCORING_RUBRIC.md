# Impact Points™ Scoring Rubric

Source: Chris (project owner), 2026-05-21.
This document is the source of truth for the `scoring_rules` table seed and
for the submission form's action picker.

## Categories

### 1. 🎥 Content Creation
| Action | Points |
|---|---|
| Instagram Story | 10 |
| Instagram Reel | 100 |
| TikTok Video | 100 |
| YouTube Short | 125 |
| YouTube Vlog | 300 |
| Podcast Appearance | 250 |
| Livestream Session | 300 |
| Drone/Cinematic Edit | 400 |

### 2. 🚀 Engagement Performance
Tiered by view count (step function, take the highest tier achieved).
| Tier | Points |
|---|---|
| 1K views | 25 |
| 10K views | 100 |
| 50K views | 300 |
| 100K views | 750 |
| 500K+ views | 2,500 |

Plus flags (admin checkboxes during review):
| Flag | Points |
|---|---|
| Viral trending content | Bonus multiplier (TBD) |
| High comment engagement | +100 |
| High share/save rate | +150 |

### 3. 📍 Hidden Gems of Houston
| Action | Points |
|---|---|
| Hidden Gem location feature | 150 |
| Restaurant spotlight | 125 |
| Nonprofit spotlight | 250 |
| Tourism route stop | 100 |
| Small business interview | 200 |
| Creator route completion | 500 |
| QR code scans generated | +10 per scan (per-unit) |

### 4. 🤝 Community Impact
| Action | Points |
|---|---|
| Volunteer participation | 250 |
| Community event attendance | 100 |
| Nonprofit fundraising support | 400 |
| Youth mentorship feature | 300 |
| Workforce development feature | 250 |
| Veteran/community support content | 300 |
| Mental health/community healing content | 300 |

### 5. ⚡ Speed of Impact (bonuses, stack on other actions)
| Action | Bonus |
|---|---|
| First creator to post from event | +250 |
| Same-day event recap | +150 |
| Livestream during live activation | +200 |
| Fastest trending creator of week | +500 |
| Real-time challenge completion | +300 |
| Viral post within 24 hours | +500 |

### 6. 🏆 Team Support
| Action | Points |
|---|---|
| Team Captain feature | 150 |
| Team nonprofit feature | 250 |
| Sponsor feature integration | 100 |
| Team collaboration post | 150 |
| Multi-creator collaboration | 250 |
| Team chant/song participation | 100 |

### 7. 🎨 Culture & Creativity (admin/judged)
| Action | Points |
|---|---|
| Best cinematic edit | 500 |
| Most creative storytelling | 500 |
| Funniest moment | 250 |
| Best hidden gem discovery | 500 |
| Best Houston culture feature | 500 |
| AI-generated anthem/song use | 150 |
| Best community interview | 300 |

### 8. 🌎 Tourism Impact
| Action | Points |
|---|---|
| Out-of-town audience engagement | 250 |
| Tourism recommendation content | 150 |
| Hidden destination feature | 200 |
| Hotel/hospitality collaboration | 150 |
| Event attendance conversion | +tracked bonus (TBD) |
| Travel creator collaboration | 300 |

## Multipliers

- **Double XP Days** (admin-toggled): event launch day, finals watch party,
  community challenge day, nonprofit spotlight weekend → all submissions
  approved that day score ×2.
- **Multi-creator collaboration**: +25% to all participating creators.
- **Creator + nonprofit + sponsor aligned**: +50% Impact Bonus™.

## Penalties

| Issue | Penalty |
|---|---|
| Negative conduct | −250 |
| Inappropriate content | Manual review |
| Failure to disclose | Penalty review |
| Spam posting | Reduced scoring |
| Low-quality repost spam | Reduced visibility |

## Live Scoreboard ranking categories

Multiple leaderboards derived from the same impact_events data:
- MVP Creator (overall)
- Fastest Rising Creator (highest delta last 7d)
- Hidden Gems Champion (most points in category 3)
- Community Impact Leader (category 4)
- Viral Storyteller (category 2)
- Tourism Ambassador (category 8)
- Creator of the Week (rolling 7-day MVP)
- Speed of Impact Leader (category 5)

Plus the team leaderboard (sum of all creators on a team).

## Weekly Awards (judged)

- MVP Creator
- Fastest Moving Team
- Hidden Gem of the Week
- Community Champion
- Viral Moment
- Best Team Collaboration
