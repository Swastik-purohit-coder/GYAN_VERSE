-- GYANARATNA Platform Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SUBJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  class TEXT,
  icon TEXT,
  color TEXT,
  created_by TEXT,
  school_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS school_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);

-- ============================================================================
-- LEARNING_MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_modules (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  class TEXT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_school_id ON learning_modules(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_class ON learning_modules(class);
CREATE INDEX IF NOT EXISTS idx_learning_modules_subject_id ON learning_modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_school_class_subject ON learning_modules(school_id, class, subject_id);

-- ============================================================================
-- QUIZZES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES learning_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit INTEGER, -- in seconds
  created_by TEXT,
  school_id TEXT,
  is_bank BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  passing_score INTEGER, -- percentage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new quiz columns exist when upgrading an already provisioned database
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS module_id TEXT REFERENCES learning_modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS school_id TEXT,
  ADD COLUMN IF NOT EXISTS is_bank BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS passing_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_school_id ON quizzes(school_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module_id ON quizzes(module_id);

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- array of answer options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  topic TEXT,
  sub_topic TEXT,
  school_id TEXT,
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure upgraded databases carry new question metadata columns
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS school_id TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS sub_topic TEXT,
  ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Apply difficulty constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'questions'
      AND constraint_name = 'questions_difficulty_check'
  ) THEN
    ALTER TABLE questions
      ADD CONSTRAINT questions_difficulty_check
      CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_school_id ON questions(school_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

-- ============================================================================
-- QUIZ_RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_responses (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  answers JSONB, -- map of question ids to answers
  score NUMERIC,
  correct_answers INTEGER,
  total_questions INTEGER,
  time_spent INTEGER, -- in seconds
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_student_id ON quiz_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);

-- ============================================================================
-- QUIZ_COMPLETIONS TABLE (for streak tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score NUMERIC,
  time_spent INTEGER, -- in seconds
  subject TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_id ON quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_completed_at ON quiz_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_date ON quiz_completions(user_id, completed_at);

-- ============================================================================
-- STREAKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STUDENT_PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_progress (
  id TEXT PRIMARY KEY,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT CHECK (role IN ('teacher', 'student', 'principal', 'admin', 'higher_body', 'unassigned')),
  name TEXT,
  email TEXT,
  phone TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  class TEXT,
  school_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  provisional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure upgrade schema carries all roles, contact, and metadata columns
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS school_id TEXT,
  ADD COLUMN IF NOT EXISTS class TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS provisional BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_phone ON user_roles(phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_parent_email ON user_roles(parent_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_parent_phone ON user_roles(parent_phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON user_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Drop obsolete check constraint if present and re-add updated constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND constraint_name = 'user_roles_role_check'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
  END IF;
  
  ALTER TABLE user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('teacher', 'student', 'principal', 'admin', 'higher_body', 'unassigned'));
END $$;

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key);

-- ============================================================================
-- SCHOOL CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS school_content (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  type TEXT CHECK (type IN ('quiz', 'article', 'video', 'material')) DEFAULT 'article',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  embed_html TEXT,
  body TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_content_school_id ON school_content(school_id);
CREATE INDEX IF NOT EXISTS idx_school_content_created_at ON school_content(created_at DESC);

-- ============================================================================
-- LESSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_path TEXT,
  video_url TEXT,
  video_type TEXT DEFAULT 'youtube',
  duration INTEGER DEFAULT 0, -- video duration in seconds
  order_index INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(module_id, order_index);

-- ============================================================================
-- LESSON_PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL, -- references Clerk user ID / user_roles.user_id
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_position INTEGER DEFAULT 0, -- video timestamp in seconds
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_lesson UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at 
  BEFORE UPDATE ON quizzes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTICEBOARD TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS noticeboard (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('academic', 'urgent', 'event', 'competition', 'exam', 'general')) DEFAULT 'general',
  target_audience TEXT DEFAULT 'all', -- 'all', 'teachers', 'students', 'class:Class 10', etc.
  target_class TEXT, -- optional specific class
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_pinned BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_by TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT DEFAULT 'principal',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_noticeboard_school_id ON noticeboard(school_id);
CREATE INDEX IF NOT EXISTS idx_noticeboard_category ON noticeboard(category);
CREATE INDEX IF NOT EXISTS idx_noticeboard_created_at ON noticeboard(created_at DESC);

-- ============================================================================
-- STUDENT SUB-GROUPS & PEER COMMUNICATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_groups (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('study_circle', 'olympiad_squad', 'hackathon_team', 'peer_tutoring', 'science_club', 'general')) DEFAULT 'study_circle',
  target_class TEXT,
  mentor_id TEXT, -- teacher in charge
  mentor_name TEXT,
  leader_id TEXT, -- student captain
  member_count INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('leader', 'member', 'mentor')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT DEFAULT 'student',
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);

-- ============================================================================
-- SCHOOL EDUCATIONAL CONTENT & VIDEO LECTURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS school_content (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  type TEXT CHECK (type IN ('quiz', 'article', 'video', 'material', 'skill')) DEFAULT 'video',
  source_type TEXT CHECK (source_type IN ('teacher', 'alumni', 'senior', 'retired_teacher', 'community')) DEFAULT 'teacher',
  author_name TEXT NOT NULL,
  author_role TEXT,
  duration TEXT DEFAULT '20 mins',
  target_grade_min INTEGER DEFAULT 1,
  target_grade_max INTEGER DEFAULT 12,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  embed_html TEXT,
  body TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_content_school ON school_content(school_id);
CREATE INDEX IF NOT EXISTS idx_school_content_source ON school_content(source_type);
CREATE INDEX IF NOT EXISTS idx_school_content_type ON school_content(type);

-- ============================================================================
-- SKILL DEVELOPMENT COURSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_courses (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'AI & Tech', 'Public Speaking', 'Robotics & IoT', 'Finance', 'Design', 'Leadership'
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  source_type TEXT CHECK (source_type IN ('teacher', 'alumni', 'senior', 'retired_teacher', 'community')) DEFAULT 'teacher',
  author_name TEXT,
  author_role TEXT,
  instructor_name TEXT,
  duration_hours INTEGER DEFAULT 10,
  target_grade_min INTEGER DEFAULT 1,
  target_grade_max INTEGER DEFAULT 12,
  badge_icon TEXT,
  badge_name TEXT,
  modules_count INTEGER DEFAULT 4,
  enrolled_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  curriculum JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES skill_courses(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT,
  progress_percent INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  certificate_id TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_enrollments_student ON skill_enrollments(student_id);

-- ============================================================================
-- MONTHLY COMPETITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_competitions (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  theme TEXT NOT NULL, -- e.g. "October STEM & AI Innovation Marathon"
  category TEXT CHECK (category IN ('hackathon', 'olympiad', 'science_fair', 'debate_essay', 'math_sprint', 'quiz_battle')) DEFAULT 'hackathon',
  month_year TEXT NOT NULL, -- e.g. 'October 2026'
  target_classes TEXT[], -- e.g. ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_pool TEXT,
  rules TEXT[],
  submission_type TEXT CHECK (submission_type IN ('quiz', 'project_link', 'video', 'document', 'team_submission')) DEFAULT 'project_link',
  status TEXT CHECK (status IN ('upcoming', 'active', 'evaluating', 'completed')) DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_entries (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL REFERENCES monthly_competitions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT,
  group_id TEXT REFERENCES student_groups(id) ON DELETE SET NULL,
  group_name TEXT,
  project_title TEXT,
  project_description TEXT,
  submission_url TEXT,
  score NUMERIC,
  rank INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_entries_comp ON competition_entries(competition_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at 
  BEFORE UPDATE ON quizzes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streaks_updated_at ON streaks;
CREATE TRIGGER update_streaks_updated_at 
  BEFORE UPDATE ON streaks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_content_updated_at ON school_content;
CREATE TRIGGER update_school_content_updated_at
  BEFORE UPDATE ON school_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_modules_updated_at ON learning_modules;
CREATE TRIGGER update_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_noticeboard_updated_at ON noticeboard;
CREATE TRIGGER update_noticeboard_updated_at
  BEFORE UPDATE ON noticeboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_groups_updated_at ON student_groups;
CREATE TRIGGER update_student_groups_updated_at
  BEFORE UPDATE ON student_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_courses_updated_at ON skill_courses;
CREATE TRIGGER update_skill_courses_updated_at
  BEFORE UPDATE ON skill_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_competitions_updated_at ON monthly_competitions;
CREATE TRIGGER update_monthly_competitions_updated_at
  BEFORE UPDATE ON monthly_competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLASS-BASED YOUTUBE COURSES SYSTEM (SYSTEM 2)
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS course_videos (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES course_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_videos_subject_id ON course_videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_order ON course_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_course_videos_is_active ON course_videos(is_active);

CREATE TABLE IF NOT EXISTS course_video_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  video_id TEXT NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
  last_position INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  completion_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_course_video UNIQUE (student_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_course_video_progress_student ON course_video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_video_progress_video ON course_video_progress(video_id);

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
-- SAMPLE DATA (Optional - comment out if not needed)
-- ============================================================================

INSERT INTO subjects (id, name, description, class, icon, color)
VALUES 
  ('subject:science', 'Science', 'Explore the wonders of science', '5-8', '🔬', '#3b82f6'),
  ('subject:math', 'Mathematics', 'Master mathematical concepts', '5-8', '🔢', '#10b981'),
  ('subject:english', 'English', 'Improve language skills', '5-8', '📚', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully with Noticeboard, Sub-Groups, Skills & Monthly Competitions!';
END $$;

