import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verify() {
  const { data: c10Subjs, error: e1 } = await supabase.from('course_subjects').select('*').in('class', ['Class 10', '10']);
  console.log('Class 10 course subjects:', c10Subjs?.map(s => `${s.id}: ${s.subject_name}`), 'Error:', e1?.message);

  const { data: vids, error: e2 } = await supabase.from('course_videos').select('id, title, subject_id');
  console.log('Total course videos in DB:', vids?.length, 'Error:', e2?.message);

  const { data: qz, error: e3 } = await supabase.from('quizzes').select('id, title, module_id, learning_modules(class)');
  console.log('Total quizzes in DB:', qz?.length, 'Error:', e3?.message);
  const c10Quizzes = qz?.filter(q => String(q.learning_modules?.class).includes('10'));
  console.log('Class 10 Quizzes:', c10Quizzes?.map(q => q.title));

  const { data: qns, error: e4 } = await supabase.from('questions').select('id, text, correct_answer').limit(5);
  console.log('Sample questions with answers:', qns, 'Error:', e4?.message);
}

verify();
