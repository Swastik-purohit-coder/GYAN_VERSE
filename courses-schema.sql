-- ============================================================================
-- GYANARATNA PLATFORM: CLASS-BASED YOUTUBE COURSES SYSTEM (SYSTEM 2)
-- ============================================================================
-- Run this script in your Supabase SQL Editor.
-- This system is completely independent of the teacher learning_modules system.
--
-- Tables created:
--   1. course_subjects
--   2. course_videos
--   3. course_video_progress
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURSE_SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS course_subjects (
  id TEXT PRIMARY KEY,
  class TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  icon TEXT DEFAULT 'BookOpen',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_subjects_class ON course_subjects(class);
CREATE INDEX IF NOT EXISTS idx_course_subjects_is_active ON course_subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_course_subjects_order ON course_subjects(display_order);

-- 2. COURSE_VIDEOS TABLE
CREATE TABLE IF NOT EXISTS course_videos (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0, -- Duration in seconds
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_videos_subject_id ON course_videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_order ON course_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_course_videos_is_active ON course_videos(is_active);

-- 3. COURSE_VIDEO_PROGRESS TABLE
-- Tracks individual student progress for course YouTube videos.
-- Isolated from teacher lesson_progress.
CREATE TABLE IF NOT EXISTS course_video_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  video_id TEXT NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
  last_position INTEGER DEFAULT 0, -- playback position in seconds
  duration INTEGER DEFAULT 0,      -- video duration in seconds
  completion_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_course_video UNIQUE (student_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_course_video_progress_student ON course_video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_video_progress_video ON course_video_progress(video_id);

-- 4. UPDATE TRIGGERS
DROP TRIGGER IF EXISTS update_course_subjects_updated_at ON course_subjects;
CREATE TRIGGER update_course_subjects_updated_at 
  BEFORE UPDATE ON course_subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_videos_updated_at ON course_videos;
CREATE TRIGGER update_course_videos_updated_at 
  BEFORE UPDATE ON course_videos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_video_progress_updated_at ON course_video_progress;
CREATE TRIGGER update_course_video_progress_updated_at 
  BEFORE UPDATE ON course_video_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: CLASS 4, CLASS 5, CLASS 6 COURSES
-- ============================================================================

-- CLASS 4 SUBJECTS
INSERT INTO course_subjects (id, class, subject_name, display_order, icon, is_active)
VALUES
  ('csubj_c4_math', 'Class 4', 'Mathematics', 1, 'Calculator', true),
  ('csubj_c4_sci', 'Class 4', 'Science', 2, 'FlaskConical', true),
  ('csubj_c4_eng', 'Class 4', 'English', 3, 'BookOpen', true)
ON CONFLICT (id) DO UPDATE SET
  class = EXCLUDED.class,
  subject_name = EXCLUDED.subject_name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;

-- CLASS 4 MATHEMATICS VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c4_m1', 'csubj_c4_math', '1. Introduction to Fractions', 'Learn what fractions mean, numerators, and denominators using visual shapes.', 'https://www.youtube.com/watch?v=ITce7f6K9as', 480, 1, true),
  ('cvid_c4_m2', 'csubj_c4_math', '2. Multiplication & Division Concepts', 'Master multi-digit multiplication and step-by-step division techniques.', 'https://www.youtube.com/watch?v=mvOkMYCygps', 600, 2, true),
  ('cvid_c4_m3', 'csubj_c4_math', '3. 2D Shapes, Symmetry & Geometry', 'Explore symmetrical patterns, polygons, and geometric spatial properties.', 'https://www.youtube.com/watch?v=24Uv8Cl5hvI', 420, 3, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 4 SCIENCE VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c4_s1', 'csubj_c4_sci', '1. How Plants Make Food: Photosynthesis', 'Discover chlorophyll, sunlight absorption, and oxygen production in leaves.', 'https://www.youtube.com/watch?v=D1Ymc311XS8', 540, 1, true),
  ('cvid_c4_s2', 'csubj_c4_sci', '2. The Human Digestive System', 'Follow food on its journey from mouth to stomach and nutrient absorption.', 'https://www.youtube.com/watch?v=VwrsL-lCzYo', 660, 2, true),
  ('cvid_c4_s3', 'csubj_c4_sci', '3. States of Matter: Solids, Liquids & Gases', 'Understand molecular arrangements and phase changes with fun examples.', 'https://www.youtube.com/watch?v=wclY8LIC-HE', 480, 3, true),
  ('cvid_c4_s4', 'csubj_c4_sci', '4. The Water Cycle in Nature', 'Learn how evaporation, condensation, and precipitation circulate Earth’s water.', 'https://www.youtube.com/watch?v=ncORPosDrjI', 360, 4, true),
  ('cvid_c4_s5', 'csubj_c4_sci', '5. Adaptations in Animals & Habitats', 'See how desert, polar, and aquatic animals survive in extreme environments.', 'https://www.youtube.com/watch?v=Z3W6n64F1xM', 510, 5, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 4 ENGLISH VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c4_e1', 'csubj_c4_eng', '1. Nouns: Common, Proper & Collective', 'Learn to identify different types of nouns with sentence examples.', 'https://www.youtube.com/watch?v=84HYE8v_Kow', 420, 1, true),
  ('cvid_c4_e2', 'csubj_c4_eng', '2. Action Verbs & Helping Verbs', 'Learn how verbs express actions and support sentence clarity.', 'https://www.youtube.com/watch?v=Uq_Vw32m_7k', 480, 2, true),
  ('cvid_c4_e3', 'csubj_c4_eng', '3. Subject and Predicate in Sentences', 'Break down complete sentences into subjects and predicates accurately.', 'https://www.youtube.com/watch?v=fdUXxdmhIsw', 360, 3, true),
  ('cvid_c4_e4', 'csubj_c4_eng', '4. Reading Comprehension Skills', 'Strategies for reading passages, identifying main ideas, and answering questions.', 'https://www.youtube.com/watch?v=2y2Bf1t6Iks', 540, 4, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 5 SUBJECTS
INSERT INTO course_subjects (id, class, subject_name, display_order, icon, is_active)
VALUES
  ('csubj_c5_math', 'Class 5', 'Mathematics', 1, 'Calculator', true),
  ('csubj_c5_sci', 'Class 5', 'Science', 2, 'FlaskConical', true),
  ('csubj_c5_eng', 'Class 5', 'English', 3, 'BookOpen', true)
ON CONFLICT (id) DO UPDATE SET
  class = EXCLUDED.class,
  subject_name = EXCLUDED.subject_name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;

-- CLASS 5 MATHEMATICS VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c5_m1', 'csubj_c5_math', '1. Introduction to Decimals & Place Value', 'Grasp tenths, hundredths, and converting fractions to decimals.', 'https://www.youtube.com/watch?v=t9vbmxPzBGE', 540, 1, true),
  ('cvid_c5_m2', 'csubj_c5_math', '2. Factors, Multiples & Prime Numbers', 'Find HCF and LCM easily using factor trees and prime factorization.', 'https://www.youtube.com/watch?v=3h4UK62Qrbo', 600, 2, true),
  ('cvid_c5_m3', 'csubj_c5_math', '3. Angles, Triangles & Protractor Use', 'Measure acute, right, and obtuse angles and calculate triangle angle sums.', 'https://www.youtube.com/watch?v=9RTM418qfdI', 480, 3, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 5 SCIENCE VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c5_s1', 'csubj_c5_sci', '1. Simple Machines & Mechanical Advantage', 'Explore levers, pulleys, inclined planes, and wheels in everyday life.', 'https://www.youtube.com/watch?v=l1Fhsl5Z46E', 540, 1, true),
  ('cvid_c5_s2', 'csubj_c5_sci', '2. Our Solar System & Planetary Motion', 'Tour the planets, their orbits, moons, and the sun’s gravitational pull.', 'https://www.youtube.com/watch?v=libKVRa01L8', 720, 2, true),
  ('cvid_c5_s3', 'csubj_c5_sci', '3. The Skeletal and Muscular System', 'Understand how bones, joints, and muscles collaborate for movement.', 'https://www.youtube.com/watch?v=JpVUqXWZlps', 600, 3, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 5 ENGLISH VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c5_e1', 'csubj_c5_eng', '1. Adjectives & Degrees of Comparison', 'Master positive, comparative, and superlative adjective forms.', 'https://www.youtube.com/watch?v=vVjZ6b1q88o', 480, 1, true),
  ('cvid_c5_e2', 'csubj_c5_eng', '2. Mastering Verb Tenses', 'Clearly communicate past, present, and future events in correct tense.', 'https://www.youtube.com/watch?v=84HYE8v_Kow', 660, 2, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 6 SUBJECTS
INSERT INTO course_subjects (id, class, subject_name, display_order, icon, is_active)
VALUES
  ('csubj_c6_math', 'Class 6', 'Mathematics', 1, 'Calculator', true),
  ('csubj_c6_sci', 'Class 6', 'Science', 2, 'FlaskConical', true),
  ('csubj_c6_eng', 'Class 6', 'English', 3, 'BookOpen', true)
ON CONFLICT (id) DO UPDATE SET
  class = EXCLUDED.class,
  subject_name = EXCLUDED.subject_name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;

-- CLASS 6 MATHEMATICS VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c6_m1', 'csubj_c6_math', '1. Integers & the Number Line', 'Understand positive and negative numbers, opposites, and addition on number lines.', 'https://www.youtube.com/watch?v=x0E4vxLydNY', 600, 1, true),
  ('cvid_c6_m2', 'csubj_c6_math', '2. Introduction to Algebra', 'Discover variables, expressions, and solving simple single-step equations.', 'https://www.youtube.com/watch?v=NybHckSEQBI', 720, 2, true),
  ('cvid_c6_m3', 'csubj_c6_math', '3. Ratio and Proportion Fundamentals', 'Learn to compare quantities, simplify ratios, and solve unit rate problems.', 'https://www.youtube.com/watch?v=RQ2nYUBVvqI', 540, 3, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 6 SCIENCE VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c6_s1', 'csubj_c6_sci', '1. Components of Food & Balanced Diet', 'Examine carbohydrates, proteins, fats, vitamins, and deficiency diseases.', 'https://www.youtube.com/watch?v=94HYE8v_Kow', 480, 1, true),
  ('cvid_c6_s2', 'csubj_c6_sci', '2. Light, Shadows and Reflections', 'Learn transparent vs opaque materials, rectilinear propagation, and mirror reflections.', 'https://www.youtube.com/watch?v=xyMrLQ4ZI-4', 540, 2, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- CLASS 6 ENGLISH VIDEOS
INSERT INTO course_videos (id, subject_id, title, description, youtube_url, duration, display_order, is_active)
VALUES
  ('cvid_c6_e1', 'csubj_c6_eng', '1. Prepositions of Place, Time & Direction', 'Master common preposition rules and avoid frequent usage errors.', 'https://www.youtube.com/watch?v=xyMrLQ4ZI-4', 480, 1, true),
  ('cvid_c6_e2', 'csubj_c6_eng', '2. Conjunctions & Clause Connections', 'Connect sentences with coordinating and subordinating conjunctions.', 'https://www.youtube.com/watch?v=48vE_x0uX8E', 420, 2, true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  youtube_url = EXCLUDED.youtube_url,
  duration = EXCLUDED.duration,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
