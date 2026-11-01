// Turns "tell me what your life looks like" into a routine: fixed commitments,
// flexible activities and reminders. The AI key lives only in the Supabase secret
// ANTHROPIC_API_KEY (task 14). Supabase checks the caller's sign-in before this runs.

const MODEL = 'claude-sonnet-5-5';
const MAX_CHARS = 4000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const CATEGORIES = ['work', 'client', 'portfolio', 'interview', 'fitness', 'personal'];
const dayList = { type: 'array', items: { type: 'integer', minimum: 0, maximum: 6 } };

const TOOL = {
  name: 'save_routine',
  description: 'Save the routine described by the user.',
  input_schema: {
    type: 'object',
    properties: {
      fixed: {
        type: 'array',
        description: 'Things at exact times that cannot move: work, classes, a Pilates class.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            cat: { type: 'string', enum: CATEGORIES },
            days: { ...dayList, description: '0 = Monday … 6 = Sunday' },
            start: { type: 'integer', description: 'Minutes since midnight' },
            end: { type: 'integer', description: 'Minutes since midnight' },
            where: { type: 'string' },
          },
          required: ['title', 'cat', 'days', 'start', 'end'],
        },
      },
      flex: {
        type: 'array',
        description: 'Things to do some times a week, whenever there is room.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            cat: { type: 'string', enum: CATEGORIES },
            freq: { type: 'integer', description: 'Sessions per week' },
            dur: { type: 'integer', description: 'Minutes per session' },
          },
          required: ['title', 'cat', 'freq', 'dur'],
        },
      },
      reminders: {
        type: 'array',
        description: 'Small things at a set time, e.g. picking up the kids.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            cat: { type: 'string', enum: CATEGORIES },
            days: dayList,
            time: { type: 'integer', description: 'Minutes since midnight' },
            lead: { type: 'integer', description: 'Heads-up in minutes before `time`' },
            leave: {
              type: 'boolean',
              description: 'True when the user must leave work or another fixed block early for it',
            },
          },
          required: ['title', 'cat', 'days', 'time', 'lead', 'leave'],
        },
      },
    },
    required: ['fixed', 'flex', 'reminders'],
  },
};

const SYSTEM = `You read how someone describes their week and sort it into three lists.
Fixed: exact times that cannot move. Flex: activities with a number of sessions a week and a length, no clock time.
Reminders: small things at a set time. Use the save_routine tool. Use only what the user said; if a length is
missing pick a sensible one (gym 60, focused work 90, other 45). Never invent commitments.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ error: 'The AI key is not set up yet.' }, 503);

  let text = '';
  try {
    text = String((await req.json()).text ?? '').trim();
  } catch {
    return json({ error: 'Send the text as JSON.' }, 400);
  }
  if (text.length < 8) return json({ error: 'Tell me a little more about your week.' }, 400);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content: text.slice(0, MAX_CHARS) }],
    }),
  });
  if (!res.ok) return json({ error: 'Could not read your week right now. Try again.' }, 502);
  const data = await res.json();
  const block = (data.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
  if (!block) return json({ error: 'Could not read your week right now. Try again.' }, 502);
  return json(block.input);
});
