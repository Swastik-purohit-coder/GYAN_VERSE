/**
 * Resource & Educational Material Access Control System
 * 
 * Rules:
 * 1. Students in Class <= 6 (Class 1 to 6) can ONLY access resources created by 'teacher' (Official Faculty).
 * 2. Students in Class > 6 (Class 7 to 12) can access all resources, including community, alumni, senior students, and retired teachers.
 * 3. Teachers, Principals, and Admins have full access and can publish/tag with any source type.
 */

export const SOURCE_TYPES = {
  teacher: {
    id: "teacher",
    label: "Official Teacher / Faculty",
    shortLabel: "Faculty",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    badgeText: "Official Faculty",
    icon: "GraduationCap",
    description: "Verified school curriculum lectures and materials prepared by active faculty.",
    allowedForClass1To6: true,
  },
  alumni: {
    id: "alumni",
    label: "Alumni Contributor",
    shortLabel: "Alumni",
    badgeColor: "bg-violet-500/10 text-violet-700 border-violet-500/30",
    badgeText: "Alumni Mentor",
    icon: "Award",
    description: "Masterclasses, entrance exam insights, and industry skills by graduated alumni.",
    allowedForClass1To6: false,
  },
  senior: {
    id: "senior",
    label: "Senior Student Peer",
    shortLabel: "Senior Peer",
    badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
    badgeText: "Senior Scholar",
    icon: "Sparkles",
    description: "Peer-to-peer study hacks, notes, and solved olympiad problems from Grade 11–12 toppers.",
    allowedForClass1To6: false,
  },
  retired_teacher: {
    id: "retired_teacher",
    label: "Retired Veteran Teacher",
    shortLabel: "Retired Faculty",
    badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    badgeText: "Veteran Educator",
    icon: "ShieldCheck",
    description: "Distinguished master lectures with decades of deep pedagogical mastery.",
    allowedForClass1To6: false,
  },
  community: {
    id: "community",
    label: "Community & Guest Expert",
    shortLabel: "Community",
    badgeColor: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30",
    badgeText: "Community Expert",
    icon: "Globe",
    description: "Curated open STEM lectures and robotics workshops from verified contributors.",
    allowedForClass1To6: false,
  },
};

/**
 * Parses any class string into a numeric grade (e.g. "Class 5", "Grade 8", "6th", "10" -> 5, 8, 6, 10)
 */
export function parseStudentGrade(classVal) {
  if (!classVal && classVal !== 0) return 10; // Default to senior if unspecified
  if (typeof classVal === "number") return classVal;
  const str = String(classVal).toLowerCase().trim();
  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (str.includes("lkg") || str.includes("ukg") || str.includes("kindergarten") || str.includes("nursery")) {
    return 0;
  }
  return 10;
}

/**
 * Returns true if student is in Class 6 or below
 */
export function isGradeUpTo6(classVal) {
  const grade = parseStudentGrade(classVal);
  return grade <= 6;
}

/**
 * Checks whether a student with a given class can access a resource of a specific source type
 */
export function canStudentAccessResource(classVal, sourceType, userRole) {
  if (userRole && ["teacher", "principal", "admin", "higher_body"].includes(userRole)) {
    return {
      allowed: true,
      reason: "Teacher & Principal full administrative access",
    };
  }

  const grade = parseStudentGrade(classVal);
  const isUpTo6 = grade <= 6;
  const normalizedSource = sourceType || "teacher";

  if (isUpTo6) {
    if (normalizedSource === "teacher") {
      return {
        allowed: true,
        reason: "Official teacher content verified for foundational classes (Grades 1–6)",
      };
    }
    return {
      allowed: false,
      reason: "Students up to Class 6 can only access official teacher-provided materials. Community, alumni, and senior content unlocks in Class 7+.",
      gradeThreshold: 7,
      requiredSource: "teacher",
    };
  }

  // Class > 6 has access to all sources
  return {
    allowed: true,
    reason: "Senior grade access enabled for community, alumni, senior, and veteran faculty content",
  };
}

/**
 * Seed educational materials encompassing video lectures, skills, and notes
 * across all contributor types.
 */
export const SEED_EDUCATIONAL_MATERIALS = [
  {
    id: "mat_1",
    title: "🎥 Introduction to Algebra & Linear Equations (Grade 6 Foundational)",
    description: "Step-by-step video lecture breaking down variable manipulation, balancing equations, and real-world word problems.",
    type: "video",
    source_type: "teacher",
    author_name: "Mrs. Ananya Sen",
    author_role: "Senior Math Faculty, Gyanaratna Academy",
    author_avatar: "A",
    url: "https://www.youtube.com/watch?v=NybHckSEQBI",
    duration: "24 mins",
    target_grade_min: 5,
    target_grade_max: 8,
    tags: ["Mathematics", "Algebra", "LinearEquations", "Grade6"],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "mat_2",
    title: "🎥 Wonders of Plant Biology & Photosynthesis Mechanism",
    description: "Illustrated video breakdown of chloroplasts, light-dependent reactions, stomata function, and plant respiration.",
    type: "video",
    source_type: "teacher",
    author_name: "Dr. Ramesh Verma",
    author_role: "Head of Science & Biology",
    author_avatar: "R",
    url: "https://www.youtube.com/watch?v=sQK3Yr4Sc_k",
    duration: "18 mins",
    target_grade_min: 4,
    target_grade_max: 7,
    tags: ["Science", "Biology", "Photosynthesis", "Grade5-7"],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "mat_3",
    title: "🎓 Alumni Lecture: From High School Physics to Building Satellites",
    description: "Alumni lecture on applying Newtonian mechanics, orbital velocity, and rocket equations, with engineering career guidance.",
    type: "video",
    source_type: "alumni",
    author_name: "Siddharth Nambiar (Class of '21)",
    author_role: "Alumni | Aerospace Engineering @ ISRO Projects",
    author_avatar: "S",
    url: "https://www.youtube.com/watch?v=0kF41iTeeuM",
    duration: "45 mins",
    target_grade_min: 8,
    target_grade_max: 12,
    tags: ["Physics", "SpaceTech", "AlumniMasterclass", "SeniorAccess"],
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: "mat_4",
    title: "⭐ Senior Peer Notes: Calculus & Coordinate Geometry Short-Tricks",
    description: "Concise handwritten guide and video walkthrough of speed-solving techniques for conic sections and integration.",
    type: "material",
    source_type: "senior",
    author_name: "Tanvi Saxena (Grade 12)",
    author_role: "Senior Scholar | National Math Olympiad Rank 14",
    author_avatar: "T",
    url: "https://www.youtube.com/watch?v=7kdf_0q6sA4",
    duration: "30 mins",
    target_grade_min: 9,
    target_grade_max: 12,
    tags: ["MathTricks", "Calculus", "SeniorPeer", "OlympiadPrep"],
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: "mat_5",
    title: "🎖️ Veteran Masterclass: Organic Chemistry Reaction Mechanisms",
    description: "In-depth conceptual masterclass by retired HoD with 35 years of teaching experience, detailing electrophilic addition.",
    type: "video",
    source_type: "retired_teacher",
    author_name: "Prof. O. P. Bhardwaj (Retd.)",
    author_role: "Former National Awardee & Senior Chemistry HoD",
    author_avatar: "O",
    url: "https://www.youtube.com/watch?v=nO3_7zJ-298",
    duration: "52 mins",
    target_grade_min: 10,
    target_grade_max: 12,
    tags: ["Chemistry", "OrganicMechanisms", "VeteranEducator", "BoardMastery"],
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
  {
    id: "mat_6",
    title: "🌐 Community Workshop: Arduino Robotics & Sensor Interfacing",
    description: "Hands-on video tutorial on wiring ultrasonic distance sensors, servo motors, and writing C++ sketches for robots.",
    type: "video",
    source_type: "community",
    author_name: "OpenSTEM Collective",
    author_role: "Verified Community Robotics Guild",
    author_avatar: "O",
    url: "https://www.youtube.com/watch?v=d8_xXNcGYgo",
    duration: "38 mins",
    target_grade_min: 7,
    target_grade_max: 12,
    tags: ["Robotics", "Arduino", "CommunityWorkshop", "HandsOn"],
    created_at: new Date(Date.now() - 3600000 * 140).toISOString(),
  },
  {
    id: "mat_7",
    title: "🎥 Solar System & Planetary Motion for Junior Learners",
    description: "Animated video lecture exploring inner and outer planets, gravity, lunar phases, and space exploration basics.",
    type: "video",
    source_type: "teacher",
    author_name: "Mr. D. K. Joshi",
    author_role: "Junior Science Lead, Gyanaratna Academy",
    author_avatar: "D",
    url: "https://www.youtube.com/watch?v=libKVRa01L8",
    duration: "16 mins",
    target_grade_min: 3,
    target_grade_max: 6,
    tags: ["Astronomy", "SolarSystem", "JuniorScience", "TeacherVerified"],
    created_at: new Date(Date.now() - 3600000 * 160).toISOString(),
  },
];
