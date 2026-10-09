#!/usr/bin/env node

/**
 * Seed Script for Class-Based YouTube Courses System (System 2)
 * Seeds curated courses for Class 4, Class 5, and Class 6.
 *
 * Usage: node scripts/seed-courses.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to read env variables manually without dotenv dependency
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const vars = {};
  for (const file of envFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!vars[k]) vars[k] = v;
        }
      });
    }
  }
  return vars;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env.local or .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const SEED_SUBJECTS = [
  // Class 4
  { id: 'csubj_c4_math', class: 'Class 4', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'csubj_c4_sci', class: 'Class 4', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'csubj_c4_eng', class: 'Class 4', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },

  // Class 5
  { id: 'csubj_c5_math', class: 'Class 5', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'csubj_c5_sci', class: 'Class 5', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'csubj_c5_eng', class: 'Class 5', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },

  // Class 6
  { id: 'csubj_c6_math', class: 'Class 6', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'csubj_c6_sci', class: 'Class 6', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'csubj_c6_eng', class: 'Class 6', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },
];

const SEED_VIDEOS = [
  // Class 4 Mathematics
  {
    id: 'cvid_c4_m1',
    subject_id: 'csubj_c4_math',
    title: '1. Introduction to Fractions',
    description: 'Learn what fractions mean, numerators, and denominators using visual shapes.',
    youtube_url: 'https://www.youtube.com/watch?v=362JVVvgYPE',
    duration: 325,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c4_m2',
    subject_id: 'csubj_c4_math',
    title: '2. Multiplication & Division Concepts',
    description: 'Master multi-digit multiplication and step-by-step division techniques.',
    youtube_url: 'https://www.youtube.com/watch?v=JJ8RTTCnDtc',
    duration: 617,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c4_m3',
    subject_id: 'csubj_c4_math',
    title: '3. 2D Shapes, Symmetry & Geometry',
    description: 'Explore symmetrical patterns, polygons, and geometric spatial properties.',
    youtube_url: 'https://www.youtube.com/watch?v=1u57rNNxDHg',
    duration: 617,
    display_order: 3,
    is_active: true,
  },

  // Class 4 Science
  {
    id: 'cvid_c4_s1',
    subject_id: 'csubj_c4_sci',
    title: '1. How Plants Make Food: Photosynthesis',
    description: 'Discover chlorophyll, sunlight absorption, and oxygen production in leaves.',
    youtube_url: 'https://www.youtube.com/watch?v=D1Ymc311XS8',
    duration: 221,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c4_s2',
    subject_id: 'csubj_c4_sci',
    title: '2. The Human Digestive System',
    description: 'Follow food on its journey from mouth to stomach and nutrient absorption.',
    youtube_url: 'https://www.youtube.com/watch?v=_O2m25_PMU8',
    duration: 504,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c4_s3',
    subject_id: 'csubj_c4_sci',
    title: '3. States of Matter: Solids, Liquids & Gases',
    description: 'Understand molecular arrangements and phase changes with fun examples.',
    youtube_url: 'https://www.youtube.com/watch?v=JQ4WduVp9k4',
    duration: 328,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'cvid_c4_s4',
    subject_id: 'csubj_c4_sci',
    title: '4. The Water Cycle in Nature',
    description: 'Learn how evaporation, condensation, and precipitation circulate Earth’s water.',
    youtube_url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
    duration: 260,
    display_order: 4,
    is_active: true,
  },
  {
    id: 'cvid_c4_s5',
    subject_id: 'csubj_c4_sci',
    title: '5. Adaptations in Animals & Habitats',
    description: 'See how desert, polar, and aquatic animals survive in extreme environments.',
    youtube_url: 'https://www.youtube.com/watch?v=QVyOrRDsD38',
    duration: 390,
    display_order: 5,
    is_active: true,
  },

  // Class 4 English
  {
    id: 'cvid_c4_e1',
    subject_id: 'csubj_c4_eng',
    title: '1. Nouns: Common, Proper & Collective',
    description: 'Learn to identify different types of nouns with sentence examples.',
    youtube_url: 'https://www.youtube.com/watch?v=gQsZr8yrsno',
    duration: 420,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c4_e2',
    subject_id: 'csubj_c4_eng',
    title: '2. Action Verbs & Helping Verbs',
    description: 'Learn how verbs express actions and support sentence clarity.',
    youtube_url: 'https://www.youtube.com/watch?v=sfF__txZ_s8',
    duration: 375,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c4_e3',
    subject_id: 'csubj_c4_eng',
    title: '3. Subject and Predicate in Sentences',
    description: 'Break down complete sentences into subjects and predicates accurately.',
    youtube_url: 'https://www.youtube.com/watch?v=6thm0FCDGL4',
    duration: 258,
    display_order: 3,
    is_active: true,
  },
  {
    id: 'cvid_c4_e4',
    subject_id: 'csubj_c4_eng',
    title: '4. Reading Comprehension Skills',
    description: 'Strategies for reading passages, identifying main ideas, and answering questions.',
    youtube_url: 'https://www.youtube.com/watch?v=NqpbTN3diUc',
    duration: 412,
    display_order: 4,
    is_active: true,
  },

  // Class 5 Mathematics
  {
    id: 'cvid_c5_m1',
    subject_id: 'csubj_c5_math',
    title: '1. Introduction to Decimals & Place Value',
    description: 'Grasp tenths, hundredths, and converting fractions to decimals.',
    youtube_url: 'https://www.youtube.com/watch?v=t9vbmxPzBGE',
    duration: 540,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c5_m2',
    subject_id: 'csubj_c5_math',
    title: '2. Factors, Multiples & Prime Numbers',
    description: 'Find HCF and LCM easily using factor trees and prime factorization.',
    youtube_url: 'https://www.youtube.com/watch?v=3h4UK62Qrbo',
    duration: 600,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c5_m3',
    subject_id: 'csubj_c5_math',
    title: '3. Angles, Triangles & Protractor Use',
    description: 'Measure acute, right, and obtuse angles and calculate triangle angle sums.',
    youtube_url: 'https://www.youtube.com/watch?v=9RTM418qfdI',
    duration: 480,
    display_order: 3,
    is_active: true,
  },

  // Class 5 Science
  {
    id: 'cvid_c5_s1',
    subject_id: 'csubj_c5_sci',
    title: '1. Simple Machines & Mechanical Advantage',
    description: 'Explore levers, pulleys, inclined planes, and wheels in everyday life.',
    youtube_url: 'https://www.youtube.com/watch?v=l1Fhsl5Z46E',
    duration: 540,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c5_s2',
    subject_id: 'csubj_c5_sci',
    title: '2. Our Solar System & Planetary Motion',
    description: 'Tour the planets, their orbits, moons, and the sun’s gravitational pull.',
    youtube_url: 'https://www.youtube.com/watch?v=libKVRa01L8',
    duration: 720,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c5_s3',
    subject_id: 'csubj_c5_sci',
    title: '3. The Skeletal and Muscular System',
    description: 'Understand how bones, joints, and muscles collaborate for movement.',
    youtube_url: 'https://www.youtube.com/watch?v=JpVUqXWZlps',
    duration: 600,
    display_order: 3,
    is_active: true,
  },

  // Class 5 English
  {
    id: 'cvid_c5_e1',
    subject_id: 'csubj_c5_eng',
    title: '1. Adjectives & Degrees of Comparison',
    description: 'Master positive, comparative, and superlative adjective forms.',
    youtube_url: 'https://www.youtube.com/watch?v=vVjZ6b1q88o',
    duration: 480,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c5_e2',
    subject_id: 'csubj_c5_eng',
    title: '2. Mastering Verb Tenses',
    description: 'Clearly communicate past, present, and future events in correct tense.',
    youtube_url: 'https://www.youtube.com/watch?v=84HYE8v_Kow',
    duration: 660,
    display_order: 2,
    is_active: true,
  },

  // Class 6 Mathematics
  {
    id: 'cvid_c6_m1',
    subject_id: 'csubj_c6_math',
    title: '1. Integers & the Number Line',
    description: 'Understand positive and negative numbers, opposites, and addition on number lines.',
    youtube_url: 'https://www.youtube.com/watch?v=x0E4vxLydNY',
    duration: 600,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c6_m2',
    subject_id: 'csubj_c6_math',
    title: '2. Introduction to Algebra',
    description: 'Discover variables, expressions, and solving simple single-step equations.',
    youtube_url: 'https://www.youtube.com/watch?v=NybHckSEQBI',
    duration: 720,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cvid_c6_m3',
    subject_id: 'csubj_c6_math',
    title: '3. Ratio and Proportion Fundamentals',
    description: 'Learn to compare quantities, simplify ratios, and solve unit rate problems.',
    youtube_url: 'https://www.youtube.com/watch?v=RQ2nYUBVvqI',
    duration: 540,
    display_order: 3,
    is_active: true,
  },

  // Class 6 Science
  {
    id: 'cvid_c6_s1',
    subject_id: 'csubj_c6_sci',
    title: '1. Components of Food & Balanced Diet',
    description: 'Examine carbohydrates, proteins, fats, vitamins, and deficiency diseases.',
    youtube_url: 'https://www.youtube.com/watch?v=94HYE8v_Kow',
    duration: 480,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c6_s2',
    subject_id: 'csubj_c6_sci',
    title: '2. Light, Shadows and Reflections',
    description: 'Learn transparent vs opaque materials, rectilinear propagation, and mirror reflections.',
    youtube_url: 'https://www.youtube.com/watch?v=-Eiv6XiUhSc',
    duration: 540,
    display_order: 2,
    is_active: true,
  },

  // Class 6 English
  {
    id: 'cvid_c6_e1',
    subject_id: 'csubj_c6_eng',
    title: '1. Prepositions of Place, Time & Direction',
    description: 'Master common preposition rules and avoid frequent usage errors.',
    youtube_url: 'https://www.youtube.com/watch?v=rNsAq18uTd4',
    duration: 480,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cvid_c6_e2',
    subject_id: 'csubj_c6_eng',
    title: '2. Conjunctions & Clause Connections',
    description: 'Connect sentences with coordinating and subordinating conjunctions.',
    youtube_url: 'https://www.youtube.com/watch?v=48vE_x0uX8E',
    duration: 420,
    display_order: 2,
    is_active: true,
  },
];

async function seed() {
  console.log('🚀 Checking course_subjects and course_videos tables...');
  const { error: testErr } = await supabase.from('course_subjects').select('id').limit(1);

  if (testErr) {
    console.error('❌ course_subjects table is not yet in Supabase schema cache: ' + testErr.message);
    console.log('\n📋 Please run the SQL in courses-schema.sql inside your Supabase SQL Editor:');
    const projId = url.split('//')[1].split('.')[0];
    console.log('   https://app.supabase.com/project/' + projId + '/sql/new\n');
    return false;
  }

  console.log('✅ course_subjects table exists. Seeding course subjects...');
  const { error: subjErr } = await supabase.from('course_subjects').upsert(SEED_SUBJECTS, { onConflict: 'id' });
  if (subjErr) {
    console.error('❌ Failed to upsert subjects: ' + subjErr.message);
    return false;
  }
  console.log(`✅ Seeded ${SEED_SUBJECTS.length} course subjects.`);

  console.log('⏳ Seeding course videos...');
  const { error: vidErr } = await supabase.from('course_videos').upsert(SEED_VIDEOS, { onConflict: 'id' });
  if (vidErr) {
    console.error('❌ Failed to upsert videos: ' + vidErr.message);
    return false;
  }
  console.log(`✅ Seeded ${SEED_VIDEOS.length} course videos.`);
  console.log('✨ Courses successfully seeded!');
  return true;
}

seed().then((ok) => {
  if (!ok) process.exit(1);
});