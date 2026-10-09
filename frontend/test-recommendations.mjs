/**
 * GyanVerse Exam Recommendation Engine Verification Test Suite
 * Tests 6 realistic student personas across class, stream, aspiration, and financial criteria.
 */

import { EXAMS_DATABASE } from './src/data/examsData.js';
import { getPersonalizedExamRecommendations, filterExams } from './src/lib/recommendationEngine.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' GYANVERSE EXAM RECOMMENDATION ENGINE VERIFICATION');
console.log(' Total Exams in Database:', EXAMS_DATABASE.length);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// -------------------------------------------------------------------------
// PERSONA 1: Class 6 Student in Odisha focused on Mathematics
// -------------------------------------------------------------------------
console.log('▶ TEST 1: Persona 1 — Class 6 Odia Student (Math Focus)');
const persona1 = {
  studentClass: 6,
  aspiration: 'math_aptitude_olympiads',
  state: 'Odisha',
};
const recs1 = getPersonalizedExamRecommendations(persona1, EXAMS_DATABASE);
const topRec1 = recs1[0];

assert(topRec1 !== undefined, 'Returned non-empty recommendations');
assert(topRec1.exam.id === 'pmst_stage_1', `Top recommendation is PMST Stage 1 (Got: ${topRec1?.exam?.title})`);
assert(topRec1.matchScore >= 90, `High match score (Got: ${topRec1?.matchScore}%)`);
assert(topRec1.matchReasons.some(r => r.includes('Odisha')), 'Contains Odisha state honor rationale');
console.log(`   Top 3 Matches: ${recs1.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// PERSONA 2: Class 8 Student from Rural School with Family Income < 3.5 Lakh
// -------------------------------------------------------------------------
console.log('▶ TEST 2: Persona 2 — Class 8 Rural Student (Need-Based Financial Aid)');
const persona2 = {
  studentClass: 8,
  aspiration: 'scholarship_financial_aid',
  familyIncome: 'below_1_5L',
  schoolType: 'government',
};
const recs2 = getPersonalizedExamRecommendations(persona2, EXAMS_DATABASE);
const topRec2 = recs2[0];
const topRecs2Ids = recs2.slice(0, 3).map(r => r.exam.id);

assert(topRec2.matchScore >= 95, `High match score (Got: ${topRec2?.matchScore}%)`);
assert(topRecs2Ids.includes('nmms_scholarship'), `Top recommendations include NMMS (Got: ${topRecs2Ids.join(', ')})`);
assert(topRecs2Ids.includes('jnvst_class_9'), 'Top recommendations include JNVST Lateral Entry for Class 9');
assert(topRec2.matchReasons.some(r => r.includes('income cap')), 'Flags income cap qualification');
console.log(`   Top 3 Matches: ${recs2.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// PERSONA 3: Class 12 PCM Student Aspiring for Armed Forces / Defense Officer
// -------------------------------------------------------------------------
console.log('▶ TEST 3: Persona 3 — Class 12 PCM Cadet (Defense Aspiration)');
const persona3 = {
  studentClass: 12,
  stream: 'pcm',
  aspiration: 'defense_armed_forces',
};
const recs3 = getPersonalizedExamRecommendations(persona3, EXAMS_DATABASE);
const topRec3 = recs3[0];

assert(topRec3.exam.id === 'nda_na', `Top recommendation is NDA & NA UPSC (Got: ${topRec3?.exam?.title})`);
assert(topRec3.matchScore >= 95, `High match score (Got: ${topRec3?.matchScore}%)`);
assert(topRec3.matchReasons.some(r => r.includes('Armed Forces')), 'Contains Armed Forces commission rationale');
console.log(`   Top 3 Matches: ${recs3.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// PERSONA 4: Class 12 PCM Student Aspiring for Pure Science & Research
// -------------------------------------------------------------------------
console.log('▶ TEST 4: Persona 4 — Class 12 PCM (Pure Science & Research Aspiration)');
const persona4 = {
  studentClass: 12,
  stream: 'pcm',
  aspiration: 'research_pure_science',
};
const recs4 = getPersonalizedExamRecommendations(persona4, EXAMS_DATABASE);
const topRecs4Ids = recs4.slice(0, 3).map(r => r.exam.id);

assert(topRecs4Ids.includes('nest_niser') || topRecs4Ids.includes('iat_iiser'), `Top recommendations include NEST or IAT (Got: ${topRecs4Ids.join(', ')})`);
assert(recs4[0].matchScore >= 95, `Research match score is high (Got: ${recs4[0]?.matchScore}%)`);
console.log(`   Top 3 Matches: ${recs4.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// PERSONA 5: Class 12 PCB Student Aspiring for Medical / Healthcare
// -------------------------------------------------------------------------
console.log('▶ TEST 5: Persona 5 — Class 12 PCB (Medical Doctor Aspiration)');
const persona5 = {
  studentClass: 12,
  stream: 'pcb',
  aspiration: 'medicine_healthcare',
};
const recs5 = getPersonalizedExamRecommendations(persona5, EXAMS_DATABASE);
const topRec5 = recs5[0];

assert(topRec5.exam.id === 'neet_ug', `Top recommendation is NEET UG (Got: ${topRec5?.exam?.title})`);
assert(topRec5.matchScore >= 95, `Medical match score is high (Got: ${topRec5?.matchScore}%)`);
assert(!recs5.slice(0, 3).map(r => r.exam.id).includes('jee_main'), 'JEE Main (PCM only) is not in top 3 for PCB Medical student');
console.log(`   Top 3 Matches: ${recs5.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// PERSONA 6: Class 12 Humanities/Commerce Student Aspiring for Central University / Law
// -------------------------------------------------------------------------
console.log('▶ TEST 6: Persona 6 — Class 12 Humanities / Arts Student');
const persona6 = {
  studentClass: 12,
  stream: 'arts_humanities',
  aspiration: 'central_universities',
};
const recs6 = getPersonalizedExamRecommendations(persona6, EXAMS_DATABASE);
const topRecs6Ids = recs6.slice(0, 3).map(r => r.exam.id);

assert(topRecs6Ids.includes('cuet_ug'), `Top recommendations include CUET UG (Got: ${topRecs6Ids.join(', ')})`);
assert(recs6[0].matchScore >= 90, `Central Univ match score is high (Got: ${recs6[0]?.matchScore}%)`);
console.log(`   Top 3 Matches: ${recs6.slice(0, 3).map(r => `${r.exam.shortName} (${r.matchScore}%)`).join(', ')}\n`);

// -------------------------------------------------------------------------
// TEST 7: Directory Filtering
// -------------------------------------------------------------------------
console.log('▶ TEST 7: Directory Filtering & Search');
const class58Exams = filterExams(EXAMS_DATABASE, { classBracket: 'class_5_8' });
assert(class58Exams.length >= 5, `Class 5-8 bracket contains at least 5 exams (Got: ${class58Exams.length})`);

const scholarships = filterExams(EXAMS_DATABASE, { category: 'scholarship' });
assert(scholarships.length >= 6, `Scholarship category contains at least 6 items (Got: ${scholarships.length})`);

const searchResults = filterExams(EXAMS_DATABASE, { searchQuery: 'navodaya' });
assert(searchResults.length >= 2, `Search query 'navodaya' returns JNVST Class 6 & Class 9 (Got: ${searchResults.length})`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(` SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL RECOMMENDATION PERSONA TESTS PASSED CLEANLY!');
}
