# Dayli

Plan your life. Your way.

A mobile app (iPhone and Android) that plans your day around what can't move: fixed commitments, flexible tasks and reminders.

- Design reference: open `design/prototype.html` in a browser.
- Plan and progress: [`TASKS.md`](TASKS.md).

## Test build on your phone (EAS)

Expo Go is fine for daily work. For a real install (own icon, splash, notifications as they will behave in the store build):

1. `npm i -g eas-cli` and `eas login` (free Expo account).
2. `eas build:configure` once, then add your Supabase values: `eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL` and the same for `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Android: `eas build -p android --profile preview` gives an installable link.
4. iPhone: `eas device:create`, then `eas build -p ios --profile preview` (needs an Apple Developer account, see task 18).
