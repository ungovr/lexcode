// lexcode-expect: 0
// Clients that share a factory name or a method name with a speech vendor but
// carry no speech: a database client, a text-only AssemblyAI-style helper, and a
// Deepgram project listing that only reads account metadata.
import { createClient } from '@supabase/supabase-js';
import { createClient as createDeepgram } from '@deepgram/sdk';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const deepgram = createDeepgram(process.env.DEEPGRAM_API_KEY);

export async function loadNotes(userId) {
  const { data } = await db.from('notes').select('*').eq('user_id', userId);
  return data;
}

export async function listProjects() {
  const { result } = await deepgram.manage.getProjects();
  return result.projects.map((p) => p.name);
}

export function listenForChanges(onChange) {
  return db.channel('notes').on('postgres_changes', { event: '*', schema: 'public' }, onChange).subscribe();
}

export function transcripts() {
  const store = { transcripts: { transcribe: (text) => text.trim() } };
  return store.transcripts.transcribe('  already text  ');
}
