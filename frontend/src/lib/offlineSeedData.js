/**
 * Comprehensive Offline Seed Data for Gyanaratna
 * Ensures full web app functionality offline via IndexedDB even if network is completely absent on first load.
 */

export const OFFLINE_SEED_MODULES = {
  studentClass: "Class 8",
  modules: [
    {
      id: "mod_stem_1",
      title: "Foundations of Algebra & Real Numbers",
      subject: "Mathematics",
      description: "Master algebraic expressions, equation solving, linear relationships, and quadratic foundations.",
      orderIndex: 1,
      lessons: [
        {
          id: "les_alg_1",
          title: "1. Real Numbers & Rational Properties",
          description: "Understanding rational, irrational, and real number lines with practical applications.",
          duration: 18,
          videoUrl: "/videos/algebra_basics.mp4",
          orderIndex: 1,
          progress: { completed: true, lastPosition: 1080, completedAt: "2026-10-07T14:20:00Z" },
        },
        {
          id: "les_alg_2",
          title: "2. Linear Equations in One Variable",
          description: "Step-by-step techniques for balancing equations and solving multi-step word problems.",
          duration: 22,
          videoUrl: "/videos/linear_equations.mp4",
          orderIndex: 2,
          progress: { completed: true, lastPosition: 1320, completedAt: "2026-10-08T11:15:00Z" },
        },
        {
          id: "les_alg_3",
          title: "3. Derivation of Quadratic Formula",
          description: "Completing the square methodology and deriving the discriminant.",
          duration: 25,
          videoUrl: "/videos/quadratic_formula.mp4",
          orderIndex: 3,
          progress: { completed: false, lastPosition: 420, completedAt: null },
        },
        {
          id: "les_alg_4",
          title: "4. Practical Algebraic Modeling Workshop",
          description: "Real-world engineering scenarios modeled through simultaneous equations.",
          duration: 30,
          videoUrl: "/videos/algebra_workshop.mp4",
          orderIndex: 4,
          progress: { completed: false, lastPosition: 0, completedAt: null },
        },
      ],
      stats: { totalLessons: 4, completedLessons: 2, isCompleted: false },
    },
    {
      id: "mod_stem_2",
      title: "Force, Motion & Classical Mechanics",
      subject: "Science",
      description: "Explore Newton's laws of motion, momentum, gravitational acceleration, and rocket propulsion.",
      orderIndex: 2,
      lessons: [
        {
          id: "les_mot_1",
          title: "1. Velocity, Acceleration & Inertia",
          description: "Kinematics in 1D, position-time graphs, and the concept of inertial frames.",
          duration: 20,
          videoUrl: "/videos/kinematics.mp4",
          orderIndex: 1,
          progress: { completed: true, lastPosition: 1200, completedAt: "2026-10-06T16:00:00Z" },
        },
        {
          id: "les_mot_2",
          title: "2. Newton's Three Laws of Motion",
          description: "Force summation, mass acceleration (F=ma), and action-reaction pairs in earth and space.",
          duration: 26,
          videoUrl: "/videos/newtons_laws.mp4",
          orderIndex: 2,
          progress: { completed: false, lastPosition: 600, completedAt: null },
        },
        {
          id: "les_mot_3",
          title: "3. Friction, Drag & Mechanical Energy",
          description: "Static vs kinetic friction, conservation of mechanical energy, and work done.",
          duration: 24,
          videoUrl: "/videos/friction_energy.mp4",
          orderIndex: 3,
          progress: { completed: false, lastPosition: 0, completedAt: null },
        },
      ],
      stats: { totalLessons: 3, completedLessons: 1, isCompleted: false },
    },
    {
      id: "mod_stem_3",
      title: "Cell Biology & Living Systems",
      subject: "Science",
      description: "Deep dive into cellular architecture, organelle function, mitosis, and energy transport.",
      orderIndex: 3,
      lessons: [
        {
          id: "les_bio_1",
          title: "1. Plant vs Animal Cell Structures",
          description: "Cell membranes, chloroplasts, mitochondria, and cell wall distinctions.",
          duration: 19,
          videoUrl: "/videos/cell_structures.mp4",
          orderIndex: 1,
          progress: { completed: true, lastPosition: 1140, completedAt: "2026-10-05T09:30:00Z" },
        },
        {
          id: "les_bio_2",
          title: "2. Photosynthesis & Cellular Respiration",
          description: "ATP generation, chlorophyll light absorption, and the Calvin cycle simplified.",
          duration: 28,
          videoUrl: "/videos/photosynthesis.mp4",
          orderIndex: 2,
          progress: { completed: false, lastPosition: 0, completedAt: null },
        },
      ],
      stats: { totalLessons: 2, completedLessons: 1, isCompleted: false },
    },
    {
      id: "mod_stem_4",
      title: "Computational Thinking & Code Algorithms",
      subject: "Technology",
      description: "Problem decomposition, algorithmic complexity, conditionals, loops, and data structures.",
      orderIndex: 4,
      lessons: [
        {
          id: "les_tech_1",
          title: "1. Algorithm Logic & Flowcharts",
          description: "Representing decisions and sequence flow with flowchart diagrams and pseudo-code.",
          duration: 15,
          videoUrl: "/videos/algorithms_intro.mp4",
          orderIndex: 1,
          progress: { completed: true, lastPosition: 900, completedAt: "2026-10-07T18:45:00Z" },
        },
        {
          id: "les_tech_2",
          title: "2. Variables, Conditionals & Loops",
          description: "Hands-on programming logic with variables, branch logic, and iterative loops.",
          duration: 24,
          videoUrl: "/videos/programming_loops.mp4",
          orderIndex: 2,
          progress: { completed: false, lastPosition: 0, completedAt: null },
        },
      ],
      stats: { totalLessons: 2, completedLessons: 1, isCompleted: false },
    },
  ],
};

export const OFFLINE_SEED_SUBJECTS = [
  { id: "sub_math", name: "Mathematics", class: "Class 8", description: "Algebra, Geometry, Trigonometry, and Practical Statistics", icon: "Calculator", color: "#635BFF" },
  { id: "sub_sci", name: "Science", class: "Class 8", description: "Physics Mechanics, Chemical Reactions, and Cellular Biology", icon: "Atom", color: "#10B981" },
  { id: "sub_tech", name: "Technology", class: "Class 8", description: "Computer Programming, Digital Systems, and Algorithms", icon: "Cpu", color: "#3B82F6" },
  { id: "sub_eng", name: "Engineering", class: "Class 8", description: "Robotics, Structural Design, and Practical Machines", icon: "Cog", color: "#F59E0B" },
  { id: "sub_soc", name: "Social Studies", class: "Class 8", description: "History, Geography, Environment, and Civic Systems", icon: "Globe", color: "#EC4899" },
];

export const OFFLINE_SEED_MENTOR = {
  mentor: {
    id: "teacher_faculty_swastik",
    name: "Swastik Kumar purohit",
    role: "Lead STEM Faculty Mentor & Advisor",
    subject: "Mathematics & Science",
    school: "Gyanaratna STEM Academy",
    email: "swastik.mentor@gyanaratna.org",
    phone: "+91 98765 43210",
    bio: "Dedicated faculty mentor providing STEM guidance, conceptual clarity, and personalized 1-on-1 doubt clearing.",
    avatarUrl: "",
    status: "Available",
    officeHours: "Mon-Sat: 9:00 AM - 6:00 PM",
  },
  student: {
    id: "student_offline_current",
    name: "Alex Morgan",
    class: "Class 8",
    school: "Gyanaratna STEM Academy",
  },
};

export const OFFLINE_SEED_DOUBTS = [
  {
    id: "doubt_offline_1",
    student_id: "student_offline_current",
    student_name: "Alex Morgan",
    student_class: "Class 8",
    teacher_id: "teacher_faculty_swastik",
    teacher_name: "Swastik Kumar purohit",
    subject: "Mathematics",
    title: "Derivation of Quadratic Formula using completing the square method",
    description: "Can you clarify why we add and subtract (b/2a)^2 after dividing by 'a'?",
    status: "answered",
    unread_by_student: false,
    unread_by_teacher: false,
    created_at: "2026-10-08T10:00:00.000Z",
    updated_at: "2026-10-08T10:30:00.000Z",
    messages: [
      {
        id: "dmsg_1",
        session_id: "doubt_offline_1",
        sender_id: "student_offline_current",
        sender_name: "Alex Morgan",
        sender_role: "student",
        message: "Can you clarify why we add and subtract (b/2a)^2 after dividing by 'a'?",
        created_at: "2026-10-08T10:00:00.000Z",
      },
      {
        id: "dmsg_2",
        session_id: "doubt_offline_1",
        sender_id: "teacher_faculty_swastik",
        sender_name: "Swastik Kumar purohit",
        sender_role: "teacher",
        message: "Great question Alex! Dividing through by 'a' gives x^2 + (b/a)x + c/a = 0. To form the perfect square (x + b/2a)^2, expanding gives x^2 + 2*(b/2a)*x + (b/2a)^2 = x^2 + (b/a)x + (b/2a)^2. That's why adding (b/2a)^2 completes the binomial square!",
        created_at: "2026-10-08T10:30:00.000Z",
      },
    ],
  },
  {
    id: "doubt_offline_2",
    student_id: "student_offline_current",
    student_name: "Alex Morgan",
    student_class: "Class 8",
    teacher_id: "teacher_faculty_swastik",
    teacher_name: "Swastik Kumar purohit",
    subject: "Science",
    title: "Newton's Third Law and rocket propulsion in space",
    description: "In a total vacuum where there is no air to push against, how does a rocket accelerate forward?",
    status: "open",
    unread_by_student: false,
    unread_by_teacher: true,
    created_at: "2026-10-09T03:00:00.000Z",
    updated_at: "2026-10-09T03:00:00.000Z",
    messages: [
      {
        id: "dmsg_3",
        session_id: "doubt_offline_2",
        sender_id: "student_offline_current",
        sender_name: "Alex Morgan",
        sender_role: "student",
        message: "In a total vacuum where there is no air to push against, how does a rocket accelerate forward?",
        created_at: "2026-10-09T03:00:00.000Z",
      },
    ],
  },
];

export const OFFLINE_SEED_GROUP = {
  group: {
    id: "grp_offline_class8",
    name: "Class 8 - STEM Innovators Squad",
    class: "Class 8",
    school_id: "Gyanaratna STEM Academy",
    member_count: 24,
    created_at: "2026-09-01T00:00:00Z",
  },
  student: {
    id: "student_offline_current",
    name: "Alex Morgan",
    class: "Class 8",
    school: "Gyanaratna STEM Academy",
  },
  onlineCount: 24,
};

export const OFFLINE_SEED_GROUP_MESSAGES = [
  {
    id: "gmsg_1",
    group_id: "grp_offline_class8",
    sender_id: "student_priya",
    sender_name: "Priya Sharma",
    sender_role: "student",
    message: "Hey everyone! Has anyone started the kinematics simulation project?",
    created_at: "2026-10-08T18:20:00Z",
  },
  {
    id: "gmsg_2",
    group_id: "grp_offline_class8",
    sender_id: "teacher_faculty_swastik",
    sender_name: "Swastik Kumar purohit",
    sender_role: "teacher",
    message: "Remember to verify your acceleration vectors before submitting your observations!",
    created_at: "2026-10-08T18:45:00Z",
  },
  {
    id: "gmsg_3",
    group_id: "grp_offline_class8",
    sender_id: "student_rohan",
    sender_name: "Rohan Verma",
    sender_role: "student",
    message: "📎 Shared educational resource: Physics_Mechanics_Formulas.pdf",
    created_at: "2026-10-09T01:30:00Z",
  },
];

export const OFFLINE_SEED_GROUP_RESOURCES = [
  {
    id: "gres_1",
    group_id: "grp_offline_class8",
    file_name: "Physics_Mechanics_Formulas.pdf",
    file_type: "application/pdf",
    file_size: 245000,
    file_url: "#",
    created_at: "2026-10-09T01:30:00Z",
  },
  {
    id: "gres_2",
    group_id: "grp_offline_class8",
    file_name: "Cell_Structure_Diagrams.png",
    file_type: "image/png",
    file_size: 512000,
    file_url: "#",
    created_at: "2026-10-08T15:00:00Z",
  },
];

export const OFFLINE_SEED_DASHBOARD = {
  student: {
    userId: "student_offline_current",
    name: "Alex Morgan",
    class: "Class 8",
    schoolId: "Gyanaratna STEM Academy",
    role: "student",
  },
  subjects: OFFLINE_SEED_SUBJECTS,
  streak: {
    current_streak: 7,
    last_completion_date: "2026-10-08",
  },
  achievements: [
    { id: "ach_1", key: "stem_explorer", title: "STEM Explorer", description: "Completed 5 distinct science and technology modules", icon: "Compass", awarded_at: "2026-10-05T12:00:00Z" },
    { id: "ach_2", key: "streak_7", title: "7-Day Streak Master", description: "Studied consecutively for 7 straight days", icon: "Flame", awarded_at: "2026-10-08T20:00:00Z" },
    { id: "ach_3", key: "quiz_champ", title: "Math Quiz Champion", description: "Scored 100% on the Algebra fundamentals evaluation", icon: "Award", awarded_at: "2026-10-07T17:30:00Z" },
  ],
  recentQuizzes: [
    { id: "qres_1", quiz_id: "quiz_alg_1", score: 95, time_spent: 180, subject: "Mathematics", completed_at: "2026-10-08T14:00:00Z" },
    { id: "qres_2", quiz_id: "quiz_sci_1", score: 90, time_spent: 240, subject: "Science", completed_at: "2026-10-07T11:30:00Z" },
  ],
  schoolContent: [
    {
      id: "sc_1",
      title: "Science Fair Project Guidelines 2026",
      description: "Complete rules, timeline, and rubrics for the upcoming regional STEM exhibition.",
      type: "announcement",
      created_at: "2026-10-01T08:00:00Z",
    },
  ],
};

export const OFFLINE_SEED_QUIZZES = [
  {
    id: "quiz_alg_1",
    title: "Algebraic Reasoning & Equation Solving",
    subject: "Mathematics",
    description: "Test your skills on linear equations, variables, and exponents.",
    totalQuestions: 5,
    durationMinutes: 10,
    passingScore: 70,
    class: "Class 8",
    questions: [
      {
        id: "q_alg_1",
        question: "Solve for x in: 3x + 7 = 22",
        options: ["x = 3", "x = 5", "x = 7", "x = 15"],
        correctAnswer: "x = 5",
        explanation: "Subtract 7 from both sides: 3x = 15. Divide by 3: x = 5.",
      },
      {
        id: "q_alg_2",
        question: "What is the degree of the polynomial 4x^3 + 2x^2 - 7?",
        options: ["1", "2", "3", "4"],
        correctAnswer: "3",
        explanation: "The degree is determined by the highest exponent of the variable, which is 3.",
      },
      {
        id: "q_alg_3",
        question: "If a = 4 and b = 3, what is the value of a^2 - 2ab + b^2?",
        options: ["1", "5", "7", "49"],
        correctAnswer: "1",
        explanation: "a^2 - 2ab + b^2 = (a - b)^2 = (4 - 3)^2 = 1^2 = 1.",
      },
      {
        id: "q_alg_4",
        question: "Which of the following is equivalent to (x + 3)(x - 3)?",
        options: ["x^2 - 9", "x^2 + 9", "x^2 - 6x + 9", "x^2 + 6x - 9"],
        correctAnswer: "x^2 - 9",
        explanation: "Difference of squares formula: (a+b)(a-b) = a^2 - b^2. Here x^2 - 3^2 = x^2 - 9.",
      },
      {
        id: "q_alg_5",
        question: "If 2x / 5 = 6, what is the value of x?",
        options: ["12", "15", "30", "10"],
        correctAnswer: "15",
        explanation: "Multiply both sides by 5: 2x = 30. Divide by 2: x = 15.",
      },
    ],
  },
  {
    id: "quiz_sci_1",
    title: "Newton's Laws & Force Interactions",
    subject: "Science",
    description: "Evaluate your comprehension of motion dynamics and inertia.",
    totalQuestions: 5,
    durationMinutes: 10,
    passingScore: 70,
    class: "Class 8",
    questions: [
      {
        id: "q_sci_1",
        question: "Which law explains why passengers jerk forward when a bus suddenly brakes?",
        options: ["First Law of Motion (Inertia)", "Second Law of Motion (F=ma)", "Third Law of Motion (Action-Reaction)", "Law of Gravitation"],
        correctAnswer: "First Law of Motion (Inertia)",
        explanation: "Inertia of motion causes bodies to continue moving forward until an external force acts.",
      },
      {
        id: "q_sci_2",
        question: "What is the SI unit of Force?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctAnswer: "Newton",
        explanation: "Force is measured in Newtons (N), where 1 N = 1 kg·m/s².",
      },
      {
        id: "q_sci_3",
        question: "If a 5 kg mass accelerates at 3 m/s², what net force is applied?",
        options: ["8 N", "15 N", "1.66 N", "25 N"],
        correctAnswer: "15 N",
        explanation: "F = m * a = 5 kg * 3 m/s² = 15 N.",
      },
      {
        id: "q_sci_4",
        question: "A rocket propels itself in outer space primarily due to:",
        options: ["Pushing against surrounding atmosphere", "Equal and opposite reaction to expelled exhaust gases", "Magnetic fields", "Solar wind"],
        correctAnswer: "Equal and opposite reaction to expelled exhaust gases",
        explanation: "Newton's third law: Expelling exhaust backwards exerts an equal forward reaction on the rocket.",
      },
      {
        id: "q_sci_5",
        question: "What is the acceleration due to gravity near Earth's surface approximately?",
        options: ["9.8 m/s²", "15 m/s²", "3.14 m/s²", "98 m/s²"],
        correctAnswer: "9.8 m/s²",
        explanation: "Standard gravitational acceleration g ≈ 9.80665 m/s².",
      },
    ],
  },
];

export const OFFLINE_SEED_LEADERBOARD = [
  { rank: 1, name: "Maya Patel", class: "Class 8", points: 2840, streak: 14, badges: 8 },
  { rank: 2, name: "Emily Chen", class: "Class 8", points: 2650, streak: 12, badges: 7 },
  { rank: 3, name: "Alex Morgan", class: "Class 8", points: 2420, streak: 7, badges: 6, isCurrent: true },
  { rank: 4, name: "Sarah Mitchell", class: "Class 8", points: 2280, streak: 9, badges: 5 },
  { rank: 5, name: "Alex Thompson", class: "Class 8", points: 2150, streak: 6, badges: 4 },
  { rank: 6, name: "James Kumar", class: "Class 8", points: 1980, streak: 5, badges: 4 },
  { rank: 7, name: "David Rodriguez", class: "Class 8", points: 1750, streak: 3, badges: 3 },
];
