// Turns a short voice note into text. The speech-to-text key lives only in the Supabase
// secret OPENAI_API_KEY. Supabase checks the caller's sign-in before this runs.
// The audio is passed straight through and never stored.

const MODEL = Deno.env.get('TRANSCRIBE_MODEL') ?? 'gpt-4o-mini-transcribe';
const MAX_BYTES = 10 * 1024 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) return json({ error: 'Voice notes are not set up yet. Type it instead.' }, 503);

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('audio');
    audio = f instanceof File ? f : null;
  } catch {
    // handled below
  }
  if (!audio || audio.size === 0)
    return json({ error: 'No recording came through. Try again.' }, 400);
  if (audio.size > MAX_BYTES)
    return json({ error: 'That recording is too long. Keep it under two minutes.' }, 413);

  const body = new FormData();
  body.append('file', audio, audio.name || 'note.m4a');
  body.append('model', MODEL);
  body.append('response_format', 'json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!res.ok) return json({ error: 'Could not hear that right now. Try again, or type it.' }, 502);
  const data = await res.json();
  return json({ text: String(data.text ?? '').trim() });
});
