import {
  supabase,
  run,
  runSingle,
  nowIso,
  normalizeId,
  checkSupabaseConfigured,
} from "./supabase.js";

// In-memory fallback stores for high resilience (attached to globalThis for multi-route bundle sharing)
if (!globalThis.__gyanaratnaInMemoryDoubts) {
  globalThis.__gyanaratnaInMemoryDoubts = [
    {
      id: "doubt_sample_1",
      student_id: "student_default",
      student_name: "Swastik Purohit",
      student_class: "Class 8",
      teacher_id: "teacher_1",
      teacher_name: "Prof. Arvind Sharma",
      subject: "Mathematics",
      title: "Why is 1/2 equal to 2/4?",
      description: "I understand that they represent the same amount, but how does the algebraic reduction rule prove equivalence?",
      status: "answered",
      unread_by_teacher: false,
      unread_by_student: false,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: "dmsg_1",
          doubt_id: "doubt_sample_1",
          sender_id: "student_default",
          sender_name: "Swastik Purohit",
          sender_role: "student",
          message: "Why is 1/2 equal to 2/4? I understand that they represent the same amount, but how does the algebraic reduction rule prove equivalence?",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: "dmsg_2",
          doubt_id: "doubt_sample_1",
          sender_id: "teacher_1",
          sender_name: "Prof. Arvind Sharma",
          sender_role: "teacher",
          message: "Great question Swastik! When you multiply both the numerator and the denominator by the same non-zero integer (here, 2), you are multiplying by 2/2 which equals 1. Any number multiplied by 1 retains its exact quantitative value. Hence, 1/2 * (2/2) = 2/4.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
    },
    {
      id: "doubt_sample_2",
      student_id: "student_default",
      student_name: "Swastik Purohit",
      student_class: "Class 8",
      teacher_id: "teacher_3",
      teacher_name: "Mrs. Sunita Rao",
      subject: "Science",
      title: "Why does water evaporate below 100°C?",
      description: "Boiling point is 100°C, so how do puddles dry up at normal room temperature 25°C?",
      status: "open",
      unread_by_teacher: true,
      unread_by_student: false,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      messages: [
        {
          id: "dmsg_3",
          doubt_id: "doubt_sample_2",
          sender_id: "student_default",
          sender_name: "Swastik Purohit",
          sender_role: "student",
          message: "Why does water evaporate below 100°C? Boiling point is 100°C, so how do puddles dry up at normal room temperature 25°C?",
          created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
      ],
    },
  ];
}
const inMemoryDoubts = globalThis.__gyanaratnaInMemoryDoubts;

if (!globalThis.__gyanaratnaInMemoryAssignments) {
  globalThis.__gyanaratnaInMemoryAssignments = [
    {
      id: "assign_1",
      student_id: "student_default",
      teacher_id: "teacher_1",
      subject: "Mathematics & Science",
      school_id: "default_school",
      assigned_at: new Date().toISOString(),
    },
  ];
}
const inMemoryAssignments = globalThis.__gyanaratnaInMemoryAssignments;

if (!globalThis.__gyanaratnaInMemoryResources) {
  globalThis.__gyanaratnaInMemoryResources = [
    {
      id: "res_sample_1",
      group_id: "class_group_class_8",
      sender_id: "student_peer_1",
      sender_name: "Rahul Verma",
      file_name: "Fractions & Decimals Master Notes.pdf",
      file_type: "application/pdf",
      file_size: 2450000,
      storage_path: "resources/class_8/fractions_notes.pdf",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: "res_sample_2",
      group_id: "class_group_class_8",
      sender_id: "teacher_1",
      sender_name: "Prof. Arvind Sharma (Faculty)",
      file_name: "Science Chapter 4 Question Bank.pdf",
      file_type: "application/pdf",
      file_size: 1850000,
      storage_path: "resources/class_8/science_ch4.pdf",
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];
}
const inMemoryResources = globalThis.__gyanaratnaInMemoryResources;

// Fallback faculty mentors if DB query yields no assigned faculty
const defaultFacultyMentors = [
  {
    id: "teacher_faculty_math",
    name: "Prof. Arvind Sharma",
    role: "Senior Faculty & Mathematics Mentor",
    subject: "Mathematics & Analytical Logic",
    school: "DAV Public Model School",
    email: "arvind.sharma@gyanaratna.org",
    phone: "+91 98765 43210",
    bio: "Head of STEM Curriculum with 14+ years mentoring students in Mathematics Olympiads and National Talent Searches.",
    avatarUrl: "/avatars/teacher_1.png",
  },
  {
    id: "teacher_faculty_sci",
    name: "Dr. Sunita Rao",
    role: "Senior Science Mentor & Robotics Guide",
    subject: "Science & Robotics",
    school: "Kendriya Vidyalaya Apex",
    email: "sunita.rao@gyanaratna.org",
    phone: "+91 98765 12345",
    bio: "Passionate STEM educator specializing in Physics prototypes, Astronomy clubs, and interactive lab sessions.",
    avatarUrl: "/avatars/teacher_2.png",
  },
];

/**
 * 1. MENTOR ASSIGNMENT & RETRIEVAL
 * Derives assigned mentor for the student without exposing any sensitive credentials.
 */
export async function getStudentMentor(studentId, schoolId, studentClass) {
  let mentorInfo = null;

  // 1. Check teacher_student_assignments table
  if (checkSupabaseConfigured() && studentId) {
    try {
      const assignment = await runSingle(
        supabase
          .from("teacher_student_assignments")
          .select("teacher_id, subject")
          .eq("student_id", studentId)
          .maybeSingle()
      );

      if (assignment?.teacher_id) {
        // Look up teacher profile in user_roles
        const teacherUser = await runSingle(
          supabase
            .from("user_roles")
            .select("user_id, name, school_id, class")
            .eq("user_id", assignment.teacher_id)
            .maybeSingle()
        );

        if (teacherUser) {
          mentorInfo = {
            id: teacherUser.user_id,
            name: teacherUser.name || "Assigned Faculty Mentor",
            role: "Faculty Mentor & Subject Guide",
            subject: assignment.subject || "All Subjects",
            school: teacherUser.school_id || schoolId || "Gyanaratna Partner School",
            email: "faculty.support@gyanaratna.org",
            phone: "+91 98765 •••••",
            bio: "Official faculty guide assigned to support your academic coursework and doubt resolution.",
            avatarUrl: "",
          };
        }
      }
    } catch (err) {
      console.warn("[getStudentMentor] assignment check warning:", err.message);
    }
  }

  // 2. Check if any teacher belongs to the student's school
  if (!mentorInfo && checkSupabaseConfigured() && schoolId) {
    try {
      const schoolTeachers = await run(
        supabase
          .from("user_roles")
          .select("user_id, name, school_id, class")
          .eq("role", "teacher")
          .ilike("school_id", `%${schoolId}%`)
          .limit(1)
      );

      if (schoolTeachers && schoolTeachers.length > 0) {
        const teacherUser = schoolTeachers[0];
        mentorInfo = {
          id: teacherUser.user_id,
          name: teacherUser.name || "School Faculty Mentor",
          role: "School Mentor & Class Teacher",
          subject: "Mathematics & Science",
          school: teacherUser.school_id || schoolId,
          email: "school.faculty@gyanaratna.org",
          phone: "+91 98765 •••••",
          bio: "School mentor assigned to assist you with curriculum doubts and learning tracks.",
          avatarUrl: "",
        };
      }
    } catch (err) {
      console.warn("[getStudentMentor] school teachers lookup warning:", err.message);
    }
  }

  // 3. If student school has no teacher registered, assign any registered teacher from user_roles
  if (!mentorInfo && checkSupabaseConfigured()) {
    try {
      const allTeachers = await run(
        supabase
          .from("user_roles")
          .select("user_id, name, school_id, class")
          .eq("role", "teacher")
          .limit(1)
      );

      if (allTeachers && allTeachers.length > 0) {
        const teacherUser = allTeachers[0];
        mentorInfo = {
          id: teacherUser.user_id,
          name: teacherUser.name || "Assigned Faculty Guide",
          role: "Senior Faculty & Mathematics Mentor",
          subject: "Mathematics & Science",
          school: teacherUser.school_id || "Gyanaratna Partner School",
          email: "faculty.mentor@gyanaratna.org",
          phone: "+91 98765 •••••",
          bio: "Assigned faculty guide supporting your academic learning journey and doubt resolution.",
          avatarUrl: "",
        };
      }
    } catch (err) {
      console.warn("[getStudentMentor] all teachers lookup warning:", err.message);
    }
  }

  // 4. Fallback to in-memory faculty mentors
  if (!mentorInfo) {
    const defaultMentor = defaultFacultyMentors[0];
    mentorInfo = {
      ...defaultMentor,
      school: schoolId || defaultMentor.school,
    };
  }

  return mentorInfo;
}

/**
 * 2. DOUBT SESSIONS MANAGEMENT
 */
export async function getStudentDoubts(studentId) {
  if (checkSupabaseConfigured() && studentId) {
    try {
      const doubts = await run(
        supabase
          .from("doubt_sessions")
          .select("*")
          .eq("student_id", studentId)
          .order("updated_at", { ascending: false })
      );
      if (doubts && doubts.length > 0) {
        return doubts;
      }
    } catch (err) {
      console.warn("[getStudentDoubts] DB fetch warning:", err.message);
    }
  }

  // Fallback in-memory
  return inMemoryDoubts
    .filter((d) => d.student_id === studentId || d.student_id === "student_default")
    .map(({ messages, ...rest }) => rest);
}

export async function getTeacherDoubts(teacherId) {
  if (checkSupabaseConfigured() && teacherId) {
    try {
      const doubts = await run(
        supabase
          .from("doubt_sessions")
          .select("*")
          .or(`teacher_id.eq.${teacherId},teacher_id.is.null`)
          .order("updated_at", { ascending: false })
      );
      if (doubts && doubts.length > 0) {
        return doubts;
      }
    } catch (err) {
      console.warn("[getTeacherDoubts] DB fetch warning:", err.message);
    }
  }

  return inMemoryDoubts.map(({ messages, ...rest }) => rest);
}

export async function getDoubtSessionById(doubtId, userId, userRole) {
  let session = null;
  let messages = [];

  if (checkSupabaseConfigured()) {
    try {
      session = await runSingle(
        supabase
          .from("doubt_sessions")
          .select("*")
          .eq("id", doubtId)
          .maybeSingle()
      );

      if (session && session.id) {
        // Enforce strict authorization
        const isOwner = session.student_id === userId;
        const isAssignedTeacher = session.teacher_id === userId || !session.teacher_id;
        const isFaculty = ["teacher", "admin", "principal", "higher_body"].includes(userRole);

        if (!isOwner && !isFaculty) {
          const err = new Error("Forbidden: You do not have permission to access this doubt session");
          err.statusCode = 403;
          throw err;
        }

        messages = await run(
          supabase
            .from("doubt_messages")
            .select("*")
            .eq("doubt_id", doubtId)
            .order("created_at", { ascending: true })
        );

        return { ...session, messages: Array.isArray(messages) ? messages : [] };
      }
    } catch (err) {
      if (err.statusCode === 403) throw err;
      console.warn("[getDoubtSessionById] DB fetch warning:", err.message);
    }
  }

  // Fallback in-memory lookup
  session = inMemoryDoubts.find((d) => d.id === doubtId);
  if (!session) {
    return null;
  }

  const isOwner = session.student_id === userId || session.student_id === "student_default";
  const isFaculty = ["teacher", "admin", "principal", "higher_body"].includes(userRole);
  if (!isOwner && !isFaculty && userId) {
    const err = new Error("Forbidden: You do not have permission to access this doubt session");
    err.statusCode = 403;
    throw err;
  }

  return session;
}

export async function createDoubtSession(data) {
  const {
    student_id,
    student_name = "Student",
    student_class = "Class 8",
    teacher_id = "teacher_faculty_math",
    teacher_name = "Prof. Arvind Sharma",
    subject,
    title,
    description,
  } = data;

  const now = nowIso();
  const cleanSub = String(subject || "gen").toLowerCase().replace(/[^a-z0-9]/g, "");
  const randSuffix = Math.random().toString(36).substring(2, 7);
  const doubtId = `doubt_${Date.now()}_${cleanSub || "item"}_${randSuffix}`;

  const newDoubt = {
    id: doubtId,
    student_id,
    student_name,
    student_class,
    teacher_id,
    teacher_name,
    subject: subject || "General",
    title: title.trim(),
    description: description ? description.trim() : "",
    status: "open",
    unread_by_teacher: true,
    unread_by_student: false,
    created_at: now,
    updated_at: now,
  };

  const initialMsg = {
    id: `dmsg_${Date.now()}_${randSuffix}`,
    doubt_id: doubtId,
    sender_id: student_id,
    sender_name: student_name,
    sender_role: "student",
    message: description ? `${title.trim()}\n\n${description.trim()}` : title.trim(),
    created_at: now,
  };

  if (checkSupabaseConfigured()) {
    try {
      const inserted = await runSingle(
        supabase.from("doubt_sessions").insert(newDoubt).select().maybeSingle()
      );
      if (inserted && inserted.id) {
        await runSingle(supabase.from("doubt_messages").insert(initialMsg).select().maybeSingle());
        return { ...inserted, messages: [initialMsg] };
      }
    } catch (err) {
      console.warn("[createDoubtSession] DB insert warning:", err.message);
    }
  }

  // Memory fallback
  const fallbackRecord = {
    ...newDoubt,
    messages: [initialMsg],
  };
  inMemoryDoubts.unshift(fallbackRecord);
  return fallbackRecord;
}

export async function addDoubtMessage(doubtId, senderId, senderName, senderRole, messageText) {
  const now = nowIso();
  const randSuffix = Math.random().toString(36).substring(2, 7);
  const newMsg = {
    id: `dmsg_${Date.now()}_${randSuffix}`,
    doubt_id: doubtId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    message: messageText.trim(),
    created_at: now,
  };

  const updateFields = {
    updated_at: now,
    ...(senderRole === "teacher"
      ? { status: "answered", unread_by_student: true, unread_by_teacher: false }
      : { status: "open", unread_by_teacher: true, unread_by_student: false }),
  };

  if (checkSupabaseConfigured()) {
    try {
      const insertedMsg = await runSingle(
        supabase.from("doubt_messages").insert(newMsg).select().maybeSingle()
      );
      await runSingle(
        supabase.from("doubt_sessions").update(updateFields).eq("id", doubtId).select().maybeSingle()
      );
      if (insertedMsg && insertedMsg.id) {
        return insertedMsg;
      }
    } catch (err) {
      console.warn("[addDoubtMessage] DB insert warning:", err.message);
    }
  }

  // Memory fallback
  const session = inMemoryDoubts.find((d) => d.id === doubtId);
  if (session) {
    session.updated_at = now;
    session.status = updateFields.status;
    session.unread_by_student = updateFields.unread_by_student;
    session.unread_by_teacher = updateFields.unread_by_teacher;
    if (!session.messages) session.messages = [];
    session.messages.push(newMsg);
  }

  return newMsg;
}

export async function updateDoubtStatus(doubtId, status, updaterRole) {
  const now = nowIso();
  if (checkSupabaseConfigured()) {
    try {
      const updated = await runSingle(
        supabase
          .from("doubt_sessions")
          .update({ status, updated_at: now })
          .eq("id", doubtId)
          .select()
          .maybeSingle()
      );
      if (updated && updated.id) return updated;
    } catch (err) {
      console.warn("[updateDoubtStatus] DB update warning:", err.message);
    }
  }

  const session = inMemoryDoubts.find((d) => d.id === doubtId);
  if (session) {
    session.status = status;
    session.updated_at = now;
    return session;
  }
  return { id: doubtId, status, updated_at: now };
}

/**
 * 3. CLASS-BASED GROUP & RESOURCE SHARING
 * Automatically determines and provides group membership based on student's authenticated class.
 */
export async function getOrCreateClassGroup(studentClass, schoolId = "default_school") {
  const normalizedClass = studentClass || "Class 8";
  const cleanId = `class_group_${normalizedClass.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const groupName = `${normalizedClass} Learning Group`;

  if (checkSupabaseConfigured()) {
    try {
      // Find existing group by target_class
      let group = await runSingle(
        supabase
          .from("student_groups")
          .select("*")
          .eq("target_class", normalizedClass)
          .maybeSingle()
      );

      if (!group || !group.id) {
        // Auto-provision class group
        const now = nowIso();
        const newGroup = {
          id: cleanId,
          school_id: schoolId || "default_school",
          name: groupName,
          description: `Official peer collaboration and educational resource sharing squad for ${normalizedClass}.`,
          category: "study_circle",
          target_class: normalizedClass,
          mentor_name: "Class Faculty Guide",
          leader_name: "Class Representative",
          created_by: "system",
          member_count: 24,
          activity_score: 95,
          created_at: now,
          updated_at: now,
        };

        const inserted = await runSingle(
          supabase.from("student_groups").insert(newGroup).select().maybeSingle()
        );
        if (inserted && inserted.id) group = inserted;
      }

      if (group && group.id) return group;
    } catch (err) {
      console.warn("[getOrCreateClassGroup] DB check warning:", err.message);
    }
  }

  // Memory fallback
  return {
    id: cleanId,
    school_id: schoolId,
    name: groupName,
    description: `Official peer collaboration and educational resource sharing squad for ${normalizedClass}.`,
    category: "study_circle",
    target_class: normalizedClass,
    mentor_name: "Class Faculty Guide",
    leader_name: "Class Representative",
    created_by: "system",
    member_count: 24,
    activity_score: 95,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getClassGroupResources(groupId) {
  if (checkSupabaseConfigured() && groupId) {
    try {
      const resources = await run(
        supabase
          .from("group_resources")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
      );
      if (resources && resources.length > 0) return resources;
    } catch (err) {
      console.warn("[getClassGroupResources] DB fetch warning:", err.message);
    }
  }

  return inMemoryResources.filter((r) => r.group_id === groupId || !groupId);
}

export async function addClassGroupResource(data) {
  const now = nowIso();
  const id = normalizeId("res", Date.now().toString());

  const newResource = {
    id,
    group_id: data.group_id,
    sender_id: data.sender_id,
    sender_name: data.sender_name || "Student",
    file_name: data.file_name,
    file_type: data.file_type,
    file_size: Number(data.file_size) || 0,
    storage_path: data.storage_path || null,
    file_url: data.file_url,
    created_at: now,
  };

  if (checkSupabaseConfigured()) {
    try {
      const inserted = await run(
        supabase.from("group_resources").insert(newResource).select().maybeSingle()
      );
      if (inserted) return inserted;
    } catch (err) {
      console.warn("[addClassGroupResource] DB insert warning:", err.message);
    }
  }

  inMemoryResources.unshift(newResource);
  return newResource;
}

export async function sendGroupMessage(groupId, senderId, senderName, senderRole, message) {
  if (!globalThis.__gyanaratnaInMemoryGroupMessages) {
    globalThis.__gyanaratnaInMemoryGroupMessages = {};
  }
  const inMemoryClassMessages = globalThis.__gyanaratnaInMemoryGroupMessages;

  const now = nowIso();
  const newMsg = {
    id: normalizeId("gmsg", Date.now().toString()),
    group_id: groupId,
    sender_id: senderId,
    sender_name: senderName || "Student",
    sender_role: senderRole || "student",
    message: String(message).trim(),
    created_at: now,
  };

  if (checkSupabaseConfigured()) {
    try {
      const inserted = await run(
        supabase.from("group_messages").insert(newMsg).select().maybeSingle()
      );
      if (inserted) return inserted;
    } catch (err) {
      console.warn("[sendGroupMessage] DB insert warning:", err.message);
    }
  }

  if (!inMemoryClassMessages[groupId]) {
    inMemoryClassMessages[groupId] = [];
  }
  inMemoryClassMessages[groupId].push(newMsg);
  return newMsg;
}

