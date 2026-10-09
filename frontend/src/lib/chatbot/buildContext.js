/**
 * Context Builder Utility for AI Study Buddy
 * 
 * Safely extracts non-sensitive user profile details (Name, School Class, School ID)
 * to personalize AI Study Buddy answers for school students.
 */

export function buildUserContext(clerkUser, extraProfile = {}, pageContext = {}) {
  const name =
    clerkUser?.fullName ||
    (clerkUser?.firstName && clerkUser?.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser?.firstName) ||
    extraProfile?.name ||
    "";

  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    extraProfile?.email ||
    "";

  const userId = clerkUser?.id || extraProfile?.userId || extraProfile?.user_id || "";

  const userClass =
    clerkUser?.unsafeMetadata?.class ||
    clerkUser?.publicMetadata?.class ||
    extraProfile?.class ||
    "";

  const schoolId =
    clerkUser?.unsafeMetadata?.schoolId ||
    clerkUser?.publicMetadata?.schoolId ||
    extraProfile?.schoolId ||
    extraProfile?.school_id ||
    "";

  const role = extraProfile?.role || "student";

  const language = pageContext?.language || "English";
  const currentRoute =
    pageContext?.route ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  return {
    userId,
    name: name ? String(name).trim() : "",
    email: email ? String(email).trim() : "",
    role,
    class: userClass,
    schoolId,
    language,
    currentRoute,
    selectedSubject: pageContext?.selectedSubject || null,
    selectedCourse: pageContext?.selectedCourse || null,
    learningProgress: pageContext?.learningProgress || null,
  };
}

/**
 * Constructs a prompt combining System Context and User Question.
 */
export function formatPromptWithContext(userMessage, context = {}, mode = "answer") {
  const contextLines = [];

  if (context?.name) {
    contextLines.push(`- Student Name: ${context.name}`);
  }
  if (context?.class) contextLines.push(`- Student Class: ${context.class}`);
  if (context?.schoolId) contextLines.push(`- School: ${context.schoolId}`);
  contextLines.push(`- Learner Profile: School Student (Target age-appropriate, clear, engaging, easy-to-understand explanations)`);
  if (context?.selectedSubject) contextLines.push(`- Current Subject: ${context.selectedSubject}`);
  if (context?.currentRoute) contextLines.push(`- Current Page: ${context.currentRoute}`);

  // Mode-specific pedagogical guidance
  const selectedMode = mode || context?.mode || "answer";
  const modeGuidance = {
    socratic: "Teaching Mode: SOCRATIC TUTOR. Do not reveal the full answer immediately. Guide the student with thought-provoking questions, relatable hints, and step-by-step encouragement so they learn how to solve it themselves.",
    explain: "Teaching Mode: CONCEPT EXPLAINER. Explain this concept step-by-step using a memorable, everyday real-world analogy (appropriate for a school student), bullet points, and simple definitions.",
    practice: "Teaching Mode: PRACTICE & QUIZ. Give a clear explanation or solution, followed by 2-3 engaging practice questions or multiple-choice questions with hints.",
    exam: "Teaching Mode: EXAM REVISION. Provide high-yield exam revision notes, essential formulas, key definitions, common student mistakes/traps, and a quick summary checklist.",
    answer: "Teaching Mode: DIRECT & COMPREHENSIVE ANSWER. Provide a clear, structured, student-friendly answer with key takeaways and bullet points.",
  };

  if (modeGuidance[selectedMode]) {
    contextLines.push(`- ${modeGuidance[selectedMode]}`);
  }

  const systemContextStr = contextLines.length
    ? `[System Context:\n${contextLines.join("\n")}\n]\n\n`
    : "";

  return `${systemContextStr}Student Question: ${userMessage}`;
}

