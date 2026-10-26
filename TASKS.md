# Dayli v1 — the daily core

One task per work session, in order. Tick a task when its pull request is opened.
Tasks marked **[needs you]** are for Fiona; sessions skip them and continue with the next task.
The app works locally (on the phone, with sample data) until Supabase is connected in task 12.

## Foundation
- [ ] **01 Expo project.** TypeScript, Expo Router, bottom tabs (Today, Calendar, Add, Tasks, More), ESLint, Prettier, Jest. Runs in Expo Go with empty screens. `.gitignore` covers `.env` and build output.
- [ ] **02 Theme and base components.** Tokens from `design/prototype.html` (light and dark colours, type scale, spacing, radii). Load Newsreader and Figtree. Text, Button, Chip, Segmented control, Checkbox, Card, Toggle.
- [ ] **03 Data and rules.** Types and sample data (tasks, fixed commitments, reminders) matching the prototype. Port `dayInfo`, `gapsOn`, `loadOf`, `remOn`, `cutFixed`, `rolloverPlan`, `parseReminder` with unit tests. A small local store (Zustand or React context) persisted with AsyncStorage.

## Today
- [ ] **04 Today, checklist.** Greeting with today's one fact, Don't forget, fixed commitments, flexible tasks, Done today. Tick off with the completion animation.
- [ ] **05 Today, visual day.** Timeline with fixed blocks, placed tasks, open gaps, reminder pills and the now line. Switch between Visual day and Checklist.
- [ ] **06 Editor.** Bottom sheet for Flexible, Fixed and Reminder (all fields from the prototype). Edit, delete, switch type.
- [ ] **07 Quick add.** One line anywhere; "remind me at 4 to…" becomes a reminder.

## Plan the week
- [ ] **08 Calendar.** Week grid and day view, day panel with free time and load, move a task to another day, place it at an open time.
- [ ] **09 Tasks screen.** Today, This week, Brain dump, Reminders, Completed, and the category filter.

## Autopilot
- [ ] **10 Reminders as notifications.** Schedule and cancel on every change; time-to-leave alerts; Done and Snooze actions; keep reminding until ticked.
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
- [ ] **19 Info website.** One static page about Dayli in `/site`.

## Later (not v1)
Goals and milestones, life chapters, voice notes, CSV import, calendar sync, payments, widgets.
