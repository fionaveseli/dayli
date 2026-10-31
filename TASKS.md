# Dayli plan

Four versions. v1 is the daily core; each later version builds on it.

# v1 — the daily core

One task per work session, in order. Tick a task when its pull request is opened.
Tasks marked **[needs you]** are for Fiona; sessions skip them and continue with the next task.
The app works locally (on the phone, with sample data) until Supabase is connected in task 12.

## Foundation

- [x] **01 Expo project.** TypeScript, Expo Router, bottom tabs (Today, Calendar, Add, Tasks, More), ESLint, Prettier, Jest. Runs in Expo Go with empty screens. `.gitignore` covers `.env` and build output.
- [x] **02 Theme and base components.** Tokens from `design/prototype.html` (light and dark colours, type scale, spacing, radii). Load Newsreader and Figtree. Text, Button, Chip, Segmented control, Checkbox, Card, Toggle.
- [x] **03 Data and rules.** Types and sample data (tasks, fixed commitments, reminders) matching the prototype. Port `dayInfo`, `gapsOn`, `loadOf`, `remOn`, `cutFixed`, `rolloverPlan`, `parseReminder` with unit tests. A small local store (Zustand or React context) persisted with AsyncStorage.

## Website

- [x] **19 Website.** Build the landing page in `design/landing.html` (open it in a browser) as the site in `/site`: plain HTML, CSS and one small script, no framework and no build step. Match the design: every section, the copy, the colours, Newsreader and Figtree, and the motion (hero lines rising, notes dropping in and floating, the phone and its timeline coming in, sections fading up on scroll, week bars and chapter progress filling, checks popping, the pulsing "next" reminder, the scroll progress line, button hovers). Keep colour tokens in one place with the same values as `src/theme`, and make repeated pieces (paper note, chip, task row, card) reusable classes. It must read well at phone width and with reduced motion turned on. The email form only shows a "coming soon" message for now (task 39 connects it). Leave `[YOUR NAME]`, `[PRICING]` and `[LAUNCH DATE]` as they are. Make sure `npm run lint` still passes with `/site` in the repo. In the pull request: how to preview it (`npx serve site`) and how to publish it for free (Vercel, Netlify or GitHub Pages).

## Today

- [x] **04 Today, checklist.** Greeting with today's one fact, Don't forget, fixed commitments, flexible tasks, Done today. Tick off with the completion animation.
- [x] **05 Today, visual day.** Timeline with fixed blocks, placed tasks, open gaps, reminder pills and the now line. Switch between Visual day and Checklist.
- [x] **06 Editor.** Bottom sheet for Flexible, Fixed and Reminder (all fields from the prototype). Edit, delete, switch type.
- [x] **07 Quick add.** One line anywhere; "remind me at 4 to…" becomes a reminder.

## Plan the week

- [x] **08 Calendar.** Week grid and day view, day panel with free time and load, move a task to another day, place it at an open time.
- [x] **09 Tasks screen.** Today, This week, Brain dump, Reminders, Completed, and the category filter.

## Autopilot

- [x] **10 Reminders as notifications.** Schedule and cancel on every change; time-to-leave alerts; Done and Snooze actions; keep reminding until ticked.
- [ ] **11 Morning plan and rollover.** Plan card to approve and a morning notification; unfinished tasks move to the next day with room when the day has ended.

## Accounts and AI

- [ ] **12 [needs you] Supabase project.** Create a free project at supabase.com and put `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`.
- [ ] **13 Schema and sign-in.** Tables and row-level security as migrations, email sign-in, and the store synced to Supabase.
- [ ] **14 [needs you] AI key.** Add the AI provider key as a Supabase secret (never in the app).
- [ ] **15 Onboarding.** Welcome, "Tell me what your life looks like" (typed), an Edge Function that turns it into a routine, the review screen, Approve.
- [ ] **16 Settings.** Working hours, breathing room, daily autopilot, reminders, theme.

## Ship it to your phone

- [ ] **17 App icon, splash and a test build** with EAS for your phone.
- [ ] **18 [needs you] Store accounts.** Apple Developer and Google Play, when you're ready to publish.

# v2 — the bigger picture

- [ ] **20 Goals and milestones.** Goals screen with the milestone timeline; tasks link to a goal and move its progress.
- [ ] **21 Life chapters.** Chapter list, chapter detail, and the new-chapter flow from the prototype.
- [ ] **22 Weekly rhythms.** "Gym 4× a week" creates its sessions on the lightest days each week; move one and the rest stay.
- [ ] **23 Sunday reset.** A two-minute weekly review: what slipped, next week proposed, approve.
- [ ] **24 Voice notes.** Speak your week in onboarding and in quick add; the transcript is shown before it's used.
- [ ] **25 CSV import.** Bring in a timetable or calendar export as fixed commitments.
- [ ] **26 Smarter nudges.** "You have a free hour now and the case study fits", only during open time and never in protected evenings.
- [ ] **27 Stuck tasks.** A task that rolled over three times asks whether it still matters.

# v3 — feels native

- [ ] **28 Home screen widgets.** Today's next thing and Don't forget, on iPhone and Android.
- [ ] **29 Lock screen alert for leaving.** The time-to-leave countdown on the lock screen (Live Activity on iPhone).
- [ ] **30 Calendar sync.** Read Apple and Google calendars as fixed commitments.
- [ ] **31 Travel time.** Leave alerts use the real journey time instead of a fixed buffer.
- [ ] **32 Place reminders.** "When I leave the office" reminders (asks for location permission, off by default).
- [ ] **33 Polish pass.** Haptics, motion, accessibility (VoiceOver, TalkBack, large text) and offline behaviour.

# v4 — a real product

- [ ] **34 [needs you] Pricing and accounts.** Decide what's in Dayli Plus and the price; create a RevenueCat account.
- [ ] **35 Dayli Plus.** Paywall and in-app purchases with RevenueCat, the free plan kept useful.
- [ ] **36 Shared reminders.** Share a reminder with someone else, e.g. both parents seeing who does today's pickup.
- [ ] **37 Crash reporting and simple analytics,** privacy-friendly, no personal data in events.
- [ ] **38 [needs you] Store listing.** Screenshots, description, privacy policy and support email.
- [ ] **39 Website waitlist.** Connect the email form in `/site` to a real waitlist (a Supabase table written through an Edge Function), and add real app screenshots to the site.
- [ ] **40 Beta, then launch.** TestFlight and Play testing build for friends, fix what they find, then public release.
