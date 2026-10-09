---
phase: 2
plan: 1
wave: 2
gap_closure: false
---

# Plan 2.1: Recommendation Engine & Wizard Logic

## Objective
Implement an intelligent, deterministic recommendation engine that scores examinations for a given student based on their class, stream, career aspirations, family income eligibility, and domicile. Build the multi-step recommendation questionnaire wizard logic.

## Context
Load these files for context:
- .gsd/SPEC.md
- shared/types/exams.ts
- frontend/src/data/examsData.js

## Tasks

<task type="auto">
  <name>Develop Core Recommendation Algorithm</name>
  <files>
    frontend/src/lib/recommendationEngine.js
    shared/services/recommendationEngine.ts
  </files>
  <action>
    Implement `getPersonalizedExamRecommendations(studentProfile, examsList)`:
    1. Filter out exams where student class is fundamentally ineligible (unless marked as 'future_goal_preview').
    2. Compute multi-factor Match Score (0 - 100%):
       - Class alignment weight (40 pts)
       - Stream / Subject match (30 pts)
       - Career goal / Aspiration alignment (20 pts)
       - Income / Category criteria bonus for scholarships (10 pts)
    3. Generate human-readable rationale tags:
       - E.g. "Direct Match for Class 8", "Matches your Pure Science aspiration", "Eligible for ₹12,000/yr stipend".
    4. Calculate urgency:
       - 'open_now', 'upcoming_soon', 'planning_ahead'.
    5. Sort results by Match Score descending and urgency.
    
    Implement `getFeaturedExamsByClassBracket(classBracket)` for quick category switching.
    Provide both JS implementation for Next.js frontend and TS for mobile.
  </action>
  <verify>
    node -e "const { getPersonalizedExamRecommendations } = require('./frontend/src/lib/recommendationEngine.js'); const { EXAMS_DATABASE } = require('./frontend/src/data/examsData.js'); const results = getPersonalizedExamRecommendations({ studentClass: 12, stream: 'pcm', aspiration: 'research_pure_science' }, EXAMS_DATABASE); console.log('Top match for 12 PCM Research:', results[0]?.title, results[0]?.matchScore + '%'); if (!results[0]?.title.includes('NEST') && !results[0]?.title.includes('IAT')) process.exit(1);"
  </verify>
  <done>
    Recommendation engine returns accurate, ranked matches for different student personas with score breakdown and tags.
  </done>
</task>

<task type="auto">
  <name>Build Recommendation Wizard Persona Tests</name>
  <files>
    frontend/test-recommendations.mjs
  </files>
  <action>
    Create a verification test script testing key personas:
    - Persona 1: Class 6 student in Odisha interested in math -> Top: Pathani Samanta PMST Stage 1.
    - Persona 2: Class 8 student from rural school with income < 3.5L -> Top: NMMS (CUM Merits) & JNVST Lateral Entry.
    - Persona 3: Class 12 PCM student wanting defense career -> Top: NDA & NA.
    - Persona 4: Class 12 PCM student wanting research -> Top: NEST & IAT.
    - Persona 5: Class 12 PCB student wanting medicine -> Top: NEET UG.
    - Persona 6: Class 12 Humanities/Commerce wanting central university -> Top: CUET UG & CLAT.
  </action>
  <verify>
    node frontend/test-recommendations.mjs
  </verify>
  <done>
    All persona test cases pass with expected top recommendations.
  </done>
</task>

## Success Criteria
- [ ] Recommendation scoring produces accurate, deterministic ranking.
- [ ] All 6 key persona test cases pass without errors.
