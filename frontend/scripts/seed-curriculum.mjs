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

const COURSE_SUBJECTS_DATA = [
  // Class 10 Subjects
  { id: 'class10-mathematics', class: 'Class 10', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class10-science', class: 'Class 10', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'class10-english', class: 'Class 10', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },
  { id: 'class10-computer', class: 'Class 10', subject_name: 'Computer Applications', display_order: 4, icon: 'Laptop', is_active: true },

  // Class 9 Subjects
  { id: 'class9-mathematics', class: 'Class 9', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class9-science', class: 'Class 9', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'class9-english', class: 'Class 9', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },
  { id: 'class9-social', class: 'Class 9', subject_name: 'Social Science', display_order: 4, icon: 'BookOpen', is_active: true },

  // Class 8 Subjects
  { id: 'Class8-Mathematics', class: 'Class 8', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'Class8-Science', class: 'Class 8', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
  { id: 'class8-english', class: 'Class 8', subject_name: 'English', display_order: 3, icon: 'BookOpen', is_active: true },

  // Class 7 Subjects
  { id: 'class7-mathematics', class: 'Class 7', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class7-science', class: 'Class 7', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },

  // Class 6 Subjects
  { id: 'class6-mathematics', class: 'Class 6', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class6-science', class: 'Class 6', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },

  // Class 5 Subjects
  { id: 'class5-mathematics', class: 'Class 5', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class5-science', class: 'Class 5', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },

  // Class 4 Subjects
  { id: 'class4-mathematics', class: 'Class 4', subject_name: 'Mathematics', display_order: 1, icon: 'Calculator', is_active: true },
  { id: 'class4-science', class: 'Class 4', subject_name: 'Science', display_order: 2, icon: 'FlaskConical', is_active: true },
];

const COURSE_VIDEOS_DATA = [
  // Class 10 Mathematics Videos
  {
    id: 'c10-math-001',
    subject_id: 'class10-mathematics',
    title: '1. Real Numbers: Fundamental Theorem of Arithmetic',
    description: 'Master prime factorisations, proving irrationality of √2 and √3, and HCF/LCM relations.',
    youtube_url: 'https://www.youtube.com/watch?v=1oW_W9bZ7vM',
    duration: '14 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c10-math-002',
    subject_id: 'class10-mathematics',
    title: '2. Polynomials: Zeroes & Coefficient Relationships',
    description: 'Geometric meaning of zeroes of a polynomial and sum/product of zeroes formulas.',
    youtube_url: 'https://www.youtube.com/watch?v=Vm7H0VTlIco',
    duration: '13 min',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'c10-math-003',
    subject_id: 'class10-mathematics',
    title: '3. Pair of Linear Equations in Two Variables',
    description: 'Substitution, elimination, and graphical solutions for intersecting/parallel lines.',
    youtube_url: 'https://www.youtube.com/watch?v=1op92oi5Vq4',
    duration: '14 min',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'c10-math-004',
    subject_id: 'class10-mathematics',
    title: '4. Quadratic Equations & The Quadratic Formula',
    description: 'Roots of quadratic equations by factorisation and discriminant (b² - 4ac) analysis.',
    youtube_url: 'https://www.youtube.com/watch?v=ZBalWWHY4Go',
    duration: '15 min',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'c10-math-005',
    subject_id: 'class10-mathematics',
    title: '5. Introduction to Trigonometry: Ratios & Identities',
    description: 'Master sin, cos, tan, cot, sec, cosec on right triangles and sin²θ + cos²θ = 1.',
    youtube_url: 'https://www.youtube.com/watch?v=PUB0TaZ7bhA',
    duration: '16 min',
    display_order: 5,
    is_active: true,
  },

  // Class 10 Science Videos
  {
    id: 'c10-sci-001',
    subject_id: 'class10-science',
    title: '1. Chemical Reactions and Equations: Balancing & Types',
    description: 'Combination, decomposition, displacement, double displacement, redox, and balancing equations.',
    youtube_url: 'https://www.youtube.com/watch?v=2Juem0lcifE',
    duration: '14 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c10-sci-002',
    subject_id: 'class10-science',
    title: '2. Acids, Bases and Salts: The pH Scale & Chemistry',
    description: 'Reactions with metals, neutralization, indicator color changes, and chlor-alkali process.',
    youtube_url: 'https://www.youtube.com/watch?v=mnbS56HQbaU',
    duration: '13 min',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'c10-sci-003',
    subject_id: 'class10-science',
    title: '3. Life Processes: Nutrition, Respiration & Circulation',
    description: 'Human digestive tract enzymes, aerobic vs anaerobic respiration, and double circulation in heart.',
    youtube_url: 'https://www.youtube.com/watch?v=48vE_x0uX8E',
    duration: '15 min',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'c10-sci-004',
    subject_id: 'class10-science',
    title: '4. Light: Reflection, Spherical Mirrors & Ray Diagrams',
    description: 'Concave & convex mirror formulas, magnification, Snell’s law of refraction, and lens power.',
    youtube_url: 'https://www.youtube.com/watch?v=gDA_nDXM-ck',
    duration: '15 min',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'c10-sci-005',
    subject_id: 'class10-science',
    title: '5. Electricity: Ohm’s Law, Resistance & Circuits',
    description: 'Electric potential, V = IR, factors affecting resistance, series vs parallel connections, and Joule heating.',
    youtube_url: 'https://www.youtube.com/watch?v=8jB74K101_k',
    duration: '16 min',
    display_order: 5,
    is_active: true,
  },

  // Class 10 English Videos
  {
    id: 'c10-eng-001',
    subject_id: 'class10-english',
    title: '1. First Flight: A Letter to God Analysis',
    description: 'Key themes of unquestioning faith, irony, character sketch of Lencho, and board exam questions.',
    youtube_url: 'https://www.youtube.com/watch?v=xyMrLQ4ZI-4',
    duration: '10 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c10-eng-002',
    subject_id: 'class10-english',
    title: '2. English Grammar: Reported Speech & Active/Passive Voice',
    description: 'Transformation rules, direct to indirect speech tenses, modal shifts, and common pitfalls.',
    youtube_url: 'https://www.youtube.com/watch?v=ITce7f6K9as',
    duration: '10 min',
    display_order: 2,
    is_active: true,
  },

  // Class 10 Computer Applications
  {
    id: 'c10-cs-001',
    subject_id: 'class10-computer',
    title: '1. Basics of HTML5 & Web Publishing',
    description: 'Document structure, tags, headings, paragraphs, ordered/unordered lists, and image embedding.',
    youtube_url: 'https://www.youtube.com/watch?v=MDLn5-zSQQI',
    duration: '14 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c10-cs-002',
    subject_id: 'class10-computer',
    title: '2. Cyber Ethics, Digital Footprints & Safety',
    description: 'Intellectual property rights, open-source software, phishing, malware prevention, and netiquette.',
    youtube_url: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
    duration: '11 min',
    display_order: 2,
    is_active: true,
  },

  // Class 9 Videos
  {
    id: 'c9-math-001',
    subject_id: 'class9-mathematics',
    title: '1. Number Systems: Irrational Numbers & Real Numbers',
    description: 'Discover decimal expansions of real numbers and operations on radicals.',
    youtube_url: 'https://www.youtube.com/watch?v=1oW_W9bZ7vM',
    duration: '12 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c9-math-002',
    subject_id: 'class9-mathematics',
    title: '2. Polynomials: Remainder & Factor Theorems',
    description: 'Zeroes of polynomials, algebraic identities, and factoring quadratics.',
    youtube_url: 'https://www.youtube.com/watch?v=Vm7H0VTlIco',
    duration: '13 min',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'c9-sci-001',
    subject_id: 'class9-science',
    title: '1. Matter in Our Surroundings & Phase Changes',
    description: 'Kinetic theory of particles, latent heat of fusion/vaporization, and evaporation.',
    youtube_url: 'https://www.youtube.com/watch?v=wclY8LIC-HE',
    duration: '11 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c9-sci-002',
    subject_id: 'class9-science',
    title: '2. The Fundamental Unit of Life: Cell Biology',
    description: 'Plasma membrane, nucleus, cytoplasm, mitochondria, and cell organelles.',
    youtube_url: 'https://www.youtube.com/watch?v=8IlzKri08kk',
    duration: '11 min',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'c9-sci-003',
    subject_id: 'class9-science',
    title: '3. Force and Newton’s Laws of Motion',
    description: 'Inertia, momentum (p = mv), F = ma, action-reaction pairs, and momentum conservation.',
    youtube_url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
    duration: '12 min',
    display_order: 3,
    is_active: true,
  },

  // Class 8 Videos
  {
    id: 'c8-math-001',
    subject_id: 'Class8-Mathematics',
    title: '1. Rational Numbers: Operations & Properties',
    description: 'Learn commutative, associative, and distributive properties of rational numbers.',
    youtube_url: 'https://www.youtube.com/watch?v=ITce7f6K9as',
    duration: '11 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c8-math-002',
    subject_id: 'Class8-Mathematics',
    title: '2. Linear Equations in One Variable',
    description: 'Techniques for solving equations with variables on both sides.',
    youtube_url: 'https://www.youtube.com/watch?v=mvOkMYCygps',
    duration: '12 min',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'c8-sci-001',
    subject_id: 'Class8-Science',
    title: '1. Crop Production and Agricultural Practices',
    description: 'Study soil preparation, sowing, irrigation, fertilizers, and harvesting.',
    youtube_url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
    duration: '10 min',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'c8-sci-002',
    subject_id: 'Class8-Science',
    title: '2. Microorganisms: Friend and Foe',
    description: 'Explore useful bacteria and harmful pathogens, vaccines, and preservation.',
    youtube_url: 'https://www.youtube.com/watch?v=VwrsL-lCzYo',
    duration: '9 min',
    display_order: 2,
    is_active: true,
  },
];

// LEARNING MODULES FOR CLASSES 10, 9, 8
const LEARNING_MODULES_DATA = [
  {
    id: 'module:c10:real_numbers',
    class: 'Class 10',
    subject_id: 'subject:math',
    title: 'Real Numbers & Polynomials',
    description: 'Fundamental Theorem of Arithmetic, irrational proofs, and zeroes of quadratic polynomials.',
    published: true,
  },
  {
    id: 'module:c10:light_optics',
    class: 'Class 10',
    subject_id: 'subject:science',
    title: 'Light: Reflection & Refraction',
    description: 'Mirror equations, ray diagrams, refractive index, Snell’s law, and lens power.',
    published: true,
  },
  {
    id: 'module:c10:chem_reactions',
    class: 'Class 10',
    subject_id: 'subject:science',
    title: 'Chemical Reactions & Equations',
    description: 'Chemical equation balancing, reaction types, oxidation-reduction, and corrosion.',
    published: true,
  },
  {
    id: 'module:c10:eng_grammar',
    class: 'Class 10',
    subject_id: 'subject:english',
    title: 'English Grammar & Literature Mastery',
    description: 'Reported speech, active and passive voice, and reading comprehension.',
    published: true,
  },
  {
    id: 'module:c9:motion_force',
    class: 'Class 9',
    subject_id: 'subject:science',
    title: 'Motion & Laws of Force',
    description: 'Uniform acceleration equations, velocity-time plots, and Newton’s laws of motion.',
    published: true,
  },
  {
    id: 'module:c9:number_systems',
    class: 'Class 9',
    subject_id: 'subject:math',
    title: 'Number Systems & Coordinate Geometry',
    description: 'Irrational real numbers, radicals, coordinate axes, and quadrants.',
    published: true,
  },
  {
    id: 'module:c8:rational_numbers',
    class: 'Class 8',
    subject_id: 'subject:math',
    title: 'Rational Numbers & Linear Equations',
    description: 'Operations on rational numbers and solving single variable linear equations.',
    published: true,
  },
  {
    id: 'module:c8:force_pressure',
    class: 'Class 8',
    subject_id: 'subject:science',
    title: 'Force, Pressure & Friction',
    description: 'Contact and non-contact forces, pressure calculations, and atmospheric pressure.',
    published: true,
  },
];

// GRADED QUIZZES
const QUIZZES_DATA = [
  // Class 10 Quizzes
  {
    id: 'quiz:c10:math:real_numbers',
    subject_id: 'subject:math',
    module_id: 'module:c10:real_numbers',
    title: 'Class 10 Real Numbers & Polynomials Mastery Quiz',
    description: 'Assess prime factorisations, HCF/LCM relationship, and zeroes of quadratic polynomials.',
    difficulty: 'medium',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
  {
    id: 'quiz:c10:sci:light_optics',
    subject_id: 'subject:science',
    module_id: 'module:c10:light_optics',
    title: 'Class 10 Light: Reflection & Refraction Quiz',
    description: 'Test your grasp of spherical mirrors, mirror formula, Snell’s law, and lens power.',
    difficulty: 'medium',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
  {
    id: 'quiz:c10:sci:chemical_reactions',
    subject_id: 'subject:science',
    module_id: 'module:c10:chem_reactions',
    title: 'Class 10 Chemical Reactions & Equations Test',
    description: 'Questions on balanced equations, redox processes, exothermic reactions, and catalysts.',
    difficulty: 'medium',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
  {
    id: 'quiz:c10:eng:grammar_mastery',
    subject_id: 'subject:english',
    module_id: 'module:c10:eng_grammar',
    title: 'Class 10 English: Grammar & Reported Speech Quiz',
    description: 'Test your command of indirect speech, passive voice, and grammatical accuracy.',
    difficulty: 'easy',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },

  // Class 9 Quizzes
  {
    id: 'quiz:c9:sci:motion_force',
    subject_id: 'subject:science',
    module_id: 'module:c9:motion_force',
    title: 'Class 9 Physics: Motion & Newton’s Laws Quiz',
    description: 'Kinematics and dynamics assessment covering velocity, acceleration, and F = ma.',
    difficulty: 'medium',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
  {
    id: 'quiz:c9:math:number_systems',
    subject_id: 'subject:math',
    module_id: 'module:c9:number_systems',
    title: 'Class 9 Mathematics: Number Systems & Geometry Test',
    description: 'Examine rational vs irrational numbers, decimal expansions, and Cartesian plane.',
    difficulty: 'medium',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },

  // Class 8 Quizzes
  {
    id: 'quiz:c8:math:rational_numbers',
    subject_id: 'subject:math',
    module_id: 'module:c8:rational_numbers',
    title: 'Class 8 Mathematics: Rational Numbers & Equations',
    description: 'Master operations on rational numbers and linear equations in one variable.',
    difficulty: 'easy',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
  {
    id: 'quiz:c8:sci:force_pressure',
    subject_id: 'subject:science',
    module_id: 'module:c8:force_pressure',
    title: 'Class 8 Science: Force, Pressure & Friction',
    description: 'Fundamental quiz on contact forces, gravitational force, and atmospheric pressure.',
    difficulty: 'easy',
    time_limit: 600,
    passing_score: 70,
    is_bank: false,
    is_published: true,
  },
];

// GRADED QUESTIONS (with explanation, options, correct answer, topic)
const QUESTIONS_DATA = [
  // Class 10 Math Quiz Questions
  {
    id: 'q:c10:m:rn:1',
    quiz_id: 'quiz:c10:math:real_numbers',
    text: 'What is the HCF of 96 and 404 using the Fundamental Theorem of Arithmetic?',
    options: ['4', '8', '2', '12'],
    correct_answer: '4',
    explanation: '96 = 2^5 * 3, and 404 = 2^2 * 101. The common prime factor with lowest exponent is 2^2 = 4.',
    difficulty: 'medium',
    topic: 'Real Numbers',
    order: 1,
  },
  {
    id: 'q:c10:m:rn:2',
    quiz_id: 'quiz:c10:math:real_numbers',
    text: 'If the zeroes of the quadratic polynomial ax² + bx + c (a ≠ 0) are α and β, what is the value of α + β?',
    options: ['-b / a', 'c / a', 'b / a', '-c / a'],
    correct_answer: '-b / a',
    explanation: 'For any quadratic polynomial, the sum of zeroes is equal to -(coefficient of x) / (coefficient of x²), which is -b/a.',
    difficulty: 'easy',
    topic: 'Polynomials',
    order: 2,
  },
  {
    id: 'q:c10:m:rn:3',
    quiz_id: 'quiz:c10:math:real_numbers',
    text: 'The decimal expansion of 13 / 3125 is terminating. After how many decimal places does it terminate?',
    options: ['5', '4', '3', '6'],
    correct_answer: '5',
    explanation: '3125 = 5^5 = 2^0 * 5^5. The highest power of 2 or 5 in the denominator is 5, so it terminates after 5 places.',
    difficulty: 'medium',
    topic: 'Real Numbers',
    order: 3,
  },
  {
    id: 'q:c10:m:rn:4',
    quiz_id: 'quiz:c10:math:real_numbers',
    text: 'If α and β are the zeroes of x² - 5x + 6, find the value of α * β.',
    options: ['6', '-6', '5', '-5'],
    correct_answer: '6',
    explanation: 'Product of zeroes α * β = c / a = 6 / 1 = 6.',
    difficulty: 'easy',
    topic: 'Polynomials',
    order: 4,
  },
  {
    id: 'q:c10:m:rn:5',
    quiz_id: 'quiz:c10:math:real_numbers',
    text: 'Which of the following is an irrational number?',
    options: ['2 + √3', '2 - √4', '√9', '3.141414... (repeating)'],
    correct_answer: '2 + √3',
    explanation: 'The sum of a rational number (2) and an irrational number (√3) is always irrational.',
    difficulty: 'easy',
    topic: 'Real Numbers',
    order: 5,
  },

  // Class 10 Science: Light & Optics Questions
  {
    id: 'q:c10:s:opt:1',
    quiz_id: 'quiz:c10:sci:light_optics',
    text: 'What is the focal length of a spherical mirror with a radius of curvature of 32 cm?',
    options: ['16 cm', '32 cm', '64 cm', '8 cm'],
    correct_answer: '16 cm',
    explanation: 'Focal length f = R / 2. Here f = 32 / 2 = 16 cm.',
    difficulty: 'easy',
    topic: 'Light & Optics',
    order: 1,
  },
  {
    id: 'q:c10:s:opt:2',
    quiz_id: 'quiz:c10:sci:light_optics',
    text: 'Which mirror is used by dentists to see enlarged images of teeth?',
    options: ['Concave mirror', 'Convex mirror', 'Plane mirror', 'Cylindrical mirror'],
    correct_answer: 'Concave mirror',
    explanation: 'When an object is placed between the pole and focus of a concave mirror, it produces an erect and magnified virtual image.',
    difficulty: 'easy',
    topic: 'Light & Optics',
    order: 2,
  },
  {
    id: 'q:c10:s:opt:3',
    quiz_id: 'quiz:c10:sci:light_optics',
    text: 'What is the SI unit of power of a lens?',
    options: ['Dioptre (D)', 'Metre (m)', 'Watt (W)', 'Lumen (lm)'],
    correct_answer: 'Dioptre (D)',
    explanation: 'Power of a lens P = 1 / f (in metres). Its SI unit is Dioptre (m⁻¹), denoted by D.',
    difficulty: 'easy',
    topic: 'Light & Optics',
    order: 3,
  },
  {
    id: 'q:c10:s:opt:4',
    quiz_id: 'quiz:c10:sci:light_optics',
    text: 'According to Snell’s Law of Refraction, what ratio remains constant for a given pair of media?',
    options: ['sin(i) / sin(r)', 'sin(i) * sin(r)', 'cos(i) / cos(r)', 'tan(i) / tan(r)'],
    correct_answer: 'sin(i) / sin(r)',
    explanation: 'Snell’s law states that sin(i) / sin(r) = constant = refractive index n₂₁.',
    difficulty: 'medium',
    topic: 'Light & Optics',
    order: 4,
  },
  {
    id: 'q:c10:s:opt:5',
    quiz_id: 'quiz:c10:sci:light_optics',
    text: 'An object is placed at 2F₁ of a convex lens. Where is the image formed?',
    options: ['At 2F₂', 'At F₂', 'Between F₂ and 2F₂', 'At infinity'],
    correct_answer: 'At 2F₂',
    explanation: 'When an object is at 2F₁ of a convex lens, a real, inverted image of the same size is formed at 2F₂ on the opposite side.',
    difficulty: 'medium',
    topic: 'Light & Optics',
    order: 5,
  },

  // Class 10 Science: Chemical Reactions Questions
  {
    id: 'q:c10:s:cr:1',
    quiz_id: 'quiz:c10:sci:chemical_reactions',
    text: 'In the reaction: Fe + CuSO₄ → FeSO₄ + Cu, what type of reaction takes place?',
    options: ['Displacement reaction', 'Combination reaction', 'Decomposition reaction', 'Double displacement reaction'],
    correct_answer: 'Displacement reaction',
    explanation: 'Iron (Fe) is more reactive than copper (Cu) and displaces copper from copper sulphate solution.',
    difficulty: 'easy',
    topic: 'Chemical Reactions',
    order: 1,
  },
  {
    id: 'q:c10:s:cr:2',
    quiz_id: 'quiz:c10:sci:chemical_reactions',
    text: 'Respiration is considered which type of reaction?',
    options: ['Exothermic reaction', 'Endothermic reaction', 'Photochemical reaction', 'Neutralization reaction'],
    correct_answer: 'Exothermic reaction',
    explanation: 'During cellular respiration, glucose is oxidised releasing energy in the form of ATP and heat, making it an exothermic reaction.',
    difficulty: 'easy',
    topic: 'Chemical Reactions',
    order: 2,
  },
  {
    id: 'q:c10:s:cr:3',
    quiz_id: 'quiz:c10:sci:chemical_reactions',
    text: 'What gas is evolved when dilute hydrochloric acid reacts with zinc granules?',
    options: ['Hydrogen gas (H₂)', 'Oxygen gas (O₂)', 'Carbon dioxide (CO₂)', 'Chlorine gas (Cl₂)'],
    correct_answer: 'Hydrogen gas (H₂)',
    explanation: 'Zn + 2HCl → ZnCl₂ + H₂↑. Hydrogen gas burns with a characteristic pop sound.',
    difficulty: 'easy',
    topic: 'Chemical Reactions',
    order: 3,
  },
  {
    id: 'q:c10:s:cr:4',
    quiz_id: 'quiz:c10:sci:chemical_reactions',
    text: 'In the redox reaction: CuO + H₂ → Cu + H₂O, which substance is reduced?',
    options: ['CuO', 'H₂', 'Cu', 'H₂O'],
    correct_answer: 'CuO',
    explanation: 'Copper(II) oxide (CuO) loses oxygen to form Cu, which means CuO is reduced.',
    difficulty: 'medium',
    topic: 'Chemical Reactions',
    order: 4,
  },
  {
    id: 'q:c10:s:cr:5',
    quiz_id: 'quiz:c10:sci:chemical_reactions',
    text: 'Why are chips packets flushed with nitrogen gas?',
    options: ['To prevent rancidity (oxidation of fats)', 'To add flavor', 'To make packets heavier', 'To absorb moisture only'],
    correct_answer: 'To prevent rancidity (oxidation of fats)',
    explanation: 'Nitrogen is an inert gas that prevents oxygen from oxidising oils and fats in fried foods, preventing rancidity.',
    difficulty: 'easy',
    topic: 'Chemical Reactions',
    order: 5,
  },

  // Class 10 English Questions
  {
    id: 'q:c10:e:1',
    quiz_id: 'quiz:c10:eng:grammar_mastery',
    text: 'Identify the correct indirect speech: He said, "I am reading a book."',
    options: [
      'He said that he was reading a book.',
      'He said that he is reading a book.',
      'He told that he had been reading a book.',
      'He says that he was reading a book.'
    ],
    correct_answer: 'He said that he was reading a book.',
    explanation: 'Present continuous ("am reading") changes to past continuous ("was reading") when reporting verb is in the past tense.',
    difficulty: 'easy',
    topic: 'Reported Speech',
    order: 1,
  },
  {
    id: 'q:c10:e:2',
    quiz_id: 'quiz:c10:eng:grammar_mastery',
    text: 'Change to passive voice: "The chef cooked a delicious meal."',
    options: [
      'A delicious meal was cooked by the chef.',
      'A delicious meal had cooked by the chef.',
      'A delicious meal is cooked by the chef.',
      'A delicious meal was being cooked by the chef.'
    ],
    correct_answer: 'A delicious meal was cooked by the chef.',
    explanation: 'Simple past tense active voice changes to "was/were + past participle (cooked)".',
    difficulty: 'easy',
    topic: 'Voice',
    order: 2,
  },
  {
    id: 'q:c10:e:3',
    quiz_id: 'quiz:c10:eng:grammar_mastery',
    text: 'In "A Letter to God", what destroyed Lencho’s corn field?',
    options: ['A devastating hailstorm', 'A severe locust attack', 'A prolonged drought', 'A river flood'],
    correct_answer: 'A devastating hailstorm',
    explanation: 'A violent hailstorm battered the valley for an hour, destroying Lencho’s ripe corn crops completely.',
    difficulty: 'easy',
    topic: 'Literature',
    order: 3,
  },
  {
    id: 'q:c10:e:4',
    quiz_id: 'quiz:c10:eng:grammar_mastery',
    text: 'Choose the correct preposition: "She has been living in this city _____ 2018."',
    options: ['since', 'for', 'from', 'in'],
    correct_answer: 'since',
    explanation: '"Since" is used with a specific point in time in the past (e.g. 2018), while "for" is used with a duration of time.',
    difficulty: 'easy',
    topic: 'Prepositions',
    order: 4,
  },

  // Class 9 Science: Motion & Force Questions
  {
    id: 'q:c9:s:mot:1',
    quiz_id: 'quiz:c9:sci:motion_force',
    text: 'What is the SI unit of acceleration?',
    options: ['m/s²', 'm/s', 'km/h', 'N·m'],
    correct_answer: 'm/s²',
    explanation: 'Acceleration is the rate of change of velocity: (m/s) / s = m/s².',
    difficulty: 'easy',
    topic: 'Motion',
    order: 1,
  },
  {
    id: 'q:c9:s:mot:2',
    quiz_id: 'quiz:c9:sci:motion_force',
    text: 'Newton’s First Law of Motion is also famously known as the Law of:',
    options: ['Inertia', 'Momentum', 'Action-Reaction', 'Gravitation'],
    correct_answer: 'Inertia',
    explanation: 'Newton’s first law states that an object maintains its state of rest or uniform motion unless acted upon by an external unbalanced force.',
    difficulty: 'easy',
    topic: 'Laws of Motion',
    order: 2,
  },
  {
    id: 'q:c9:s:mot:3',
    quiz_id: 'quiz:c9:sci:motion_force',
    text: 'A car accelerates uniformly from 18 km/h to 36 km/h in 5 seconds. What is its acceleration in m/s²?',
    options: ['1 m/s²', '2 m/s²', '3.6 m/s²', '0.5 m/s²'],
    correct_answer: '1 m/s²',
    explanation: '18 km/h = 5 m/s, 36 km/h = 10 m/s. a = (v - u) / t = (10 - 5) / 5 = 1 m/s².',
    difficulty: 'medium',
    topic: 'Motion',
    order: 3,
  },
  {
    id: 'q:c9:s:mot:4',
    quiz_id: 'quiz:c9:sci:motion_force',
    text: 'What is the formula representing Newton’s Second Law of Motion?',
    options: ['F = m * a', 'F = m / a', 'p = m * v²', 'W = F * d'],
    correct_answer: 'F = m * a',
    explanation: 'Force is directly proportional to the rate of change of momentum, yielding F = ma.',
    difficulty: 'easy',
    topic: 'Laws of Motion',
    order: 4,
  },

  // Class 9 Math Questions
  {
    id: 'q:c9:m:ns:1',
    quiz_id: 'quiz:c9:math:number_systems',
    text: 'What is the value of (√5 + √2)(√5 - √2)?',
    options: ['3', '7', '√3', '10'],
    correct_answer: '3',
    explanation: '(a + b)(a - b) = a² - b². Here, (√5)² - (√2)² = 5 - 2 = 3.',
    difficulty: 'easy',
    topic: 'Number Systems',
    order: 1,
  },
  {
    id: 'q:c9:m:ns:2',
    quiz_id: 'quiz:c9:math:number_systems',
    text: 'In which quadrant does the point (-3, 4) lie?',
    options: ['Quadrant II', 'Quadrant I', 'Quadrant III', 'Quadrant IV'],
    correct_answer: 'Quadrant II',
    explanation: 'When x is negative and y is positive, the point lies in the second quadrant (Quadrant II).',
    difficulty: 'easy',
    topic: 'Coordinate Geometry',
    order: 2,
  },
  {
    id: 'q:c9:m:ns:3',
    quiz_id: 'quiz:c9:math:number_systems',
    text: 'The point where the x-axis and y-axis intersect is called the:',
    options: ['Origin (0, 0)', 'Abscissa', 'Ordinate', 'Centroid'],
    correct_answer: 'Origin (0, 0)',
    explanation: 'The point of intersection of coordinate axes is known as the origin, with coordinates (0, 0).',
    difficulty: 'easy',
    topic: 'Coordinate Geometry',
    order: 3,
  },

  // Class 8 Math Questions
  {
    id: 'q:c8:m:rn:1',
    quiz_id: 'quiz:c8:math:rational_numbers',
    text: 'What is the additive inverse of -7 / 19?',
    options: ['7 / 19', '-19 / 7', '19 / 7', '0'],
    correct_answer: '7 / 19',
    explanation: 'The additive inverse of a/b is -a/b such that their sum equals 0. (-7/19) + (7/19) = 0.',
    difficulty: 'easy',
    topic: 'Rational Numbers',
    order: 1,
  },
  {
    id: 'q:c8:m:rn:2',
    quiz_id: 'quiz:c8:math:rational_numbers',
    text: 'Solve the equation for x: 2x - 3 = 7.',
    options: ['x = 5', 'x = 4', 'x = 2', 'x = 10'],
    correct_answer: 'x = 5',
    explanation: '2x = 7 + 3 = 10, so x = 10 / 2 = 5.',
    difficulty: 'easy',
    topic: 'Linear Equations',
    order: 2,
  },
  {
    id: 'q:c8:m:rn:3',
    quiz_id: 'quiz:c8:math:rational_numbers',
    text: 'What is the multiplicative inverse (reciprocal) of -13 / 17?',
    options: ['-17 / 13', '17 / 13', '13 / 17', '1'],
    correct_answer: '-17 / 13',
    explanation: 'The multiplicative inverse of a/b is b/a such that their product equals 1.',
    difficulty: 'easy',
    topic: 'Rational Numbers',
    order: 3,
  },

  // Class 8 Science Questions
  {
    id: 'q:c8:s:fp:1',
    quiz_id: 'quiz:c8:sci:force_pressure',
    text: 'Pressure is defined as:',
    options: ['Force per unit area (Force / Area)', 'Force * Area', 'Mass * Acceleration', 'Work / Time'],
    correct_answer: 'Force per unit area (Force / Area)',
    explanation: 'Pressure = Force acting perpendicular to a surface divided by the area of contact (P = F / A).',
    difficulty: 'easy',
    topic: 'Force and Pressure',
    order: 1,
  },
  {
    id: 'q:c8:s:fp:2',
    quiz_id: 'quiz:c8:sci:force_pressure',
    text: 'Which of the following is a non-contact force?',
    options: ['Gravitational force', 'Frictional force', 'Muscular force', 'Tension force'],
    correct_answer: 'Gravitational force',
    explanation: 'Gravitational, electrostatic, and magnetic forces act without physical contact between objects.',
    difficulty: 'easy',
    topic: 'Force and Pressure',
    order: 2,
  },
  {
    id: 'q:c8:s:fp:3',
    quiz_id: 'quiz:c8:sci:force_pressure',
    text: 'What is the SI unit of pressure?',
    options: ['Pascal (Pa)', 'Newton (N)', 'Joule (J)', 'Watt (W)'],
    correct_answer: 'Pascal (Pa)',
    explanation: 'One Pascal equals one Newton per square metre (1 Pa = 1 N/m²).',
    difficulty: 'easy',
    topic: 'Force and Pressure',
    order: 3,
  },
];

async function seed() {
  console.log('--- SEEDING COURSE SUBJECTS ---');
  for (const s of COURSE_SUBJECTS_DATA) {
    const { error } = await supabase.from('course_subjects').upsert(s, { onConflict: 'id' });
    if (error) console.error(`Error inserting subject ${s.id}:`, error.message);
    else console.log(`✓ Subject ${s.id} (${s.class} ${s.subject_name})`);
  }

  console.log('\n--- SEEDING COURSE VIDEOS ---');
  for (const v of COURSE_VIDEOS_DATA) {
    const { error } = await supabase.from('course_videos').upsert(v, { onConflict: 'id' });
    if (error) console.error(`Error inserting video ${v.id}:`, error.message);
    else console.log(`✓ Video: ${v.title}`);
  }

  console.log('\n--- SEEDING LEARNING MODULES ---');
  for (const m of LEARNING_MODULES_DATA) {
    const { error } = await supabase.from('learning_modules').upsert(m, { onConflict: 'id' });
    if (error) console.error(`Error inserting module ${m.id}:`, error.message);
    else console.log(`✓ Module: ${m.title} (${m.class})`);
  }

  console.log('\n--- SEEDING QUIZZES ---');
  for (const q of QUIZZES_DATA) {
    const { error } = await supabase.from('quizzes').upsert(q, { onConflict: 'id' });
    if (error) console.error(`Error inserting quiz ${q.id}:`, error.message);
    else console.log(`✓ Quiz: ${q.title}`);
  }

  console.log('\n--- SEEDING QUESTIONS ---');
  for (const qn of QUESTIONS_DATA) {
    const { error } = await supabase.from('questions').upsert(qn, { onConflict: 'id' });
    if (error) console.error(`Error inserting question ${qn.id}:`, error.message);
    else console.log(`✓ Question ${qn.id} (${qn.topic})`);
  }

  console.log('\n✅ ALL SEED DATA SUCCESSFULLY PUSHED TO SUPABASE!');
}

seed().catch(console.error);
