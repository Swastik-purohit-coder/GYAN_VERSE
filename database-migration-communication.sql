-- ============================================================================
-- GYANARATNA STUDENT COMMUNICATION & MENTORSHIP MIGRATION
-- Features:
-- 1. My Doubt Sessions (doubt_sessions, doubt_messages)
-- 2. My Mentor (teacher_student_assignments)
-- 3. My Group Resource Sharing (group_resources)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. DOUBT_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doubt_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT,
  teacher_id TEXT,
  teacher_name TEXT,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'answered', 'closed')) DEFAULT 'open',
  unread_by_teacher BOOLEAN DEFAULT TRUE,
  unread_by_student BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doubt_sessions_student ON doubt_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_teacher ON doubt_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_status ON doubt_sessions(status);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_updated ON doubt_sessions(updated_at DESC);

-- ============================================================================
-- 2. DOUBT_MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doubt_messages (
  id TEXT PRIMARY KEY,
  doubt_id TEXT NOT NULL REFERENCES doubt_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('student', 'teacher', 'system')) DEFAULT 'student',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doubt_messages_doubt ON doubt_messages(doubt_id);
CREATE INDEX IF NOT EXISTS idx_doubt_messages_created ON doubt_messages(created_at ASC);

-- ============================================================================
-- 3. TEACHER_STUDENT_ASSIGNMENTS TABLE (Mentorship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject TEXT,
  school_id TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_teacher_subject UNIQUE (student_id, teacher_id, subject)
);

CREATE INDEX IF NOT EXISTS idx_teacher_student_student ON teacher_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_teacher ON teacher_student_assignments(teacher_id);

-- ============================================================================
-- 4. GROUP_RESOURCES TABLE (Educational File & Resource Sharing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_resources (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  storage_path TEXT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_resources_group ON group_resources(group_id);
CREATE INDEX IF NOT EXISTS idx_group_resources_created ON group_resources(created_at DESC);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_doubt_sessions_updated_at ON doubt_sessions;
CREATE TRIGGER update_doubt_sessions_updated_at
  BEFORE UPDATE ON doubt_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
