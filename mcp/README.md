# Dayli MCP (prototype)

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets an AI assistant
read a Dayli plan: the day's schedule, free time, tasks and a suggested plan for the day.

**Status: in progress, read-only, local only.** It runs on sample data on your own machine.
There is no sign-in, no network access and no way to change anything yet.
It is an experiment and not part of the app's roadmap in `TASKS.md`.

## How it fits with the app

The server reuses the app's own types and scheduling rules from `src/data` and `src/rules`.
Only `src/dayli.ts` imports from the app, so there is exactly one place where the two meet.
The app never imports anything from `mcp/`, and the root `tsc`, ESLint and Jest skip this folder.

```
mcp/
  src/
    dayli.ts          the one import boundary into the app
    core/clock.ts     where "now" comes from (real or pinned)
    core/dates.ts     turns "today", "friday" or a date into a day of this week, or refuses
    core/errors.ts    error codes, messages and hints for the agent
    data/source.ts    where the plan comes from (sample data now, Supabase later)
  test/               node:test, no model involved
```

## Dates

Dayli stores days as Monday to Sunday with no week attached, so it can only describe the current week.
Every day a tool receives goes through `resolveDay`, which either maps it to a day in this week or
refuses with an error the agent can act on:

| Input                                                    | Result                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| nothing, `today`                                         | today                                                         |
| `tomorrow`, `yesterday`                                  | that day, or `DAY_OUT_OF_RANGE` when it falls in another week |
| a weekday that is today or still ahead (`sunday`, `sun`) | that day                                                      |
| a weekday that has passed (`monday` on a Saturday)       | `AMBIGUOUS_DAY`: it could mean the past Monday or next week's |
| `YYYY-MM-DD` within this week                            | that day, marked `isPast` when it has gone                    |
| `YYYY-MM-DD` outside this week, `next tuesday`           | `DAY_OUT_OF_RANGE`                                            |
| anything else                                            | `INVALID_DAY`, with the forms that are accepted               |

The server never quietly answers for a different day than the one asked about.

## Run the tests

```
cd mcp
npm install
npm test
```

## Limits

- It reads the app's sample plan, not the data on your phone (that stays on the device until Supabase).
- Only the current week can be described.
- Nothing is written anywhere.
