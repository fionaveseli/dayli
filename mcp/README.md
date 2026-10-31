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
    tools/            one file per tool, plus the input and output schemas
    config.ts         settings from environment variables
    server.ts         registers the tools with the MCP SDK
    main.ts           starts the server on stdio
  test/               node:test, no model involved
```

## Tools

### `get_day_schedule`

One day of the current week: fixed commitments, flexible tasks and reminders, with free time and load
already worked out by the app's own rules.

Input: `day` (optional, defaults to today). See [Dates](#dates).

Output (also sent as JSON text after a one-line summary, for clients that only read text):

| Field         | Meaning                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| `day`         | date, weekday, `is_today`, `is_past`, and the week Dayli can describe                      |
| `now`         | current local time, only when the day is today                                             |
| `fixed[]`     | start, end, place; `cut_short_by` when a "time to leave" reminder ends it early            |
| `tasks[]`     | timed tasks first, then flexible ones by priority; minutes, start or null, done            |
| `reminders[]` | time, when the alert fires (after heads-up and snooze), time to leave, done                |
| `summary`     | free minutes (waking time minus fixed blocks and breathing room), planned, remaining, load |
| `data_source` | where the plan came from, so the agent can say it is sample data                           |

Errors: `DAY_OUT_OF_RANGE`, `AMBIGUOUS_DAY`, `INVALID_DAY`, `DATA_UNAVAILABLE`, each with a hint.

## Run it

```
cd mcp
npm install
npm test            # tool tests, no model involved
npm run inspect     # MCP Inspector in the browser: call the tool by hand
```

Settings (environment variables):

- `DAYLI_TZ`: time zone for "today" and "now", e.g. `Europe/Belgrade` (default: the computer's)
- `DAYLI_NOW`: pin "now" for demos, e.g. `2026-10-26T08:00:00+01:00` (sample data is busiest on Monday)

### With Claude Code

```
claude mcp add dayli -e DAYLI_TZ=Europe/Belgrade -- /path/to/dayli/mcp/node_modules/.bin/tsx /path/to/dayli/mcp/src/main.ts
```

### With Claude Desktop

Add to `claude_desktop_config.json`, then restart Claude Desktop:

```json
{
  "mcpServers": {
    "dayli": {
      "command": "/path/to/dayli/mcp/node_modules/.bin/tsx",
      "args": ["/path/to/dayli/mcp/src/main.ts"],
      "env": { "DAYLI_TZ": "Europe/Belgrade" }
    }
  }
}
```

Start `tsx` directly rather than through `npm run`, because npm prints a banner on stdout and stdout
carries the protocol.

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

## Limits

- It reads the app's sample plan, not the data on your phone (that stays on the device until Supabase).
- Only the current week can be described.
- Nothing is written anywhere.
