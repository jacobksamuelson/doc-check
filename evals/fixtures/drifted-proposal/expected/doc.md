# Saved searches: v1 proposal

Owner: Sam Rivera · Status: for approval

## Why now

Students run the same job search over and over. In our October interviews, nine of the twelve students we talked to said they retype the same filters every time they open the app, and several said they had given up on filters altogether because it felt like too much work to set them up again on every visit. I think this is the single most annoying small thing in search right now, and it is cheap to fix, which is why I want it in this cycle rather than the next one.

## What we're proposing

Let students save a search (the query plus its filters) and run it again in one tap. v1 has four parts:

- Save the current search from the filter bar
- A "Saved" tab that lists saved searches
- Rename and delete a saved search
- A badge on the Saved tab showing new results since the last visit

## Not in v1

- Email alerts when a saved search has new results (next cycle)
- Sharing saved searches with friends
- Saved searches on desktop web

## Design

v1 reuses the existing filter chips and list rows, so there is no new design work. The save button sits at the right end of the filter bar:

![Filter bar with a bookmark icon at its right end](filter-bar.png)

## Decisions

- Saved searches are private to the student in v1 (decided Nov 4).
- We will not migrate old bookmarked jobs into saved searches.
- Each student can keep up to 20 saved searches.

## Open questions

- What happens to a saved search when a filter it uses is retired? (Marco)

## Who

- Eng: Marco Diaz
- PM: Sam Rivera

## Rollout

Ship to 10% of students first, then to everyone if the save rate holds.
