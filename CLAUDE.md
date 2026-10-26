# Dayli

Dayli is a mobile app (iPhone and Android) that plans your day around what can't move.
Three kinds of things: fixed commitments (exact times), flexible tasks (a duration and a day, no clock),
and reminders (small things at a set time, including "time to leave"). Dayli makes the plan; the user approves it.

The approved design is `design/prototype.html` (open it in a browser). It is the reference for every screen,
for copy, and for the logic. Port behaviour from its pure functions (`dayInfo`, `gapsOn`, `loadOf`, `remOn`,
`cutFixed`, `rolloverPlan`, `parseReminder`) rather than inventing new rules.

## Stack

- Expo (React Native, TypeScript, Expo Router), one codebase for iOS and Android.
- Supabase for accounts, data and Edge Functions (the AI parsing runs in an Edge Function).
- `expo-notifications` for reminders, scheduled on the device.
- Design tokens live in `src/theme`. Two typefaces: Newsreader (page titles, chapter names, wordmark) and Figtree (everything else).
- The desktop website is only an informative page about the app (`/site`), not the app.

## How each work session runs

1. Read `TASKS.md`. Do the first task that is not ticked and not marked **[needs you]**. Do only that one task.
2. If the previous task's pull request is still open, do not start a new task: address its review comments, push, and stop.
3. Work on a new branch named `task-NN-short-name`. Never commit to `main`.
4. Before opening the pull request, run `npx tsc --noEmit`, `npm run lint` and `npm test`, and fix what fails.
5. Tick the task in `TASKS.md` in the same branch.
6. Open a pull request titled `Task NN: <name>`. In its description: what changed, how to test it on the phone
   (Expo Go), and anything the user must do. Keep it short.
7. If a task needs something only the user can provide (an account, a key, a decision), do the preparation,
   explain exactly what is needed in the pull request, and stop.

## Rules

- Never commit secrets. Keys go in `.env` (git-ignored) or Supabase secrets. The repo is public.
  Only the Supabase URL and anon key may use the `EXPO_PUBLIC_` prefix.
- No AI attribution anywhere: no `Co-Authored-By` lines, no "Generated with" footers, no session links,
  no mention of Claude in commits, pull requests, code comments or docs.
- Keep commits small and messages plain ("Add Today checklist", not essays).
- Match the prototype's look: warm paper ground, solid pastel = fixed, paper notes = flexible, colour only on data and status.
- Touch targets at least 44px; respect safe areas; support light and dark.
- Don't add libraries when a few lines will do. Ask in the pull request before adding anything large.
