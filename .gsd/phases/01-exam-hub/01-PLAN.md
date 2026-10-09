---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Core Types & Comprehensive Class-Wise Exam Knowledge Base

## Objective
Establish the foundational data structures and complete, production-grade dataset of 20+ examinations and scholarships spanning Class 5 to Class 12. This serves as the single source of truth for both web and mobile platforms.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- shared/types.ts
- shared/constants.ts

## Tasks

<task type="auto">
  <name>Create TypeScript definitions for Exams & Scholarships</name>
  <files>
    shared/types/exams.ts
    shared/types.ts
  </files>
  <action>
    Define exhaustive interfaces for:
    - ExamCategory ('scholarship', 'school_admission', 'engineering', 'medical', 'defense', 'research', 'central_university', 'law', 'olympiad')
    - TargetClassBracket ('class_5_8', 'class_9_10', 'class_11_12')
    - StreamType ('pcm', 'pcb', 'pcmb', 'commerce', 'arts_humanities', 'any')
    - ExamBenefit (type, title, description, monetaryAmountPerYear, perks)
    - ExamEligibility (classesAllowed, minPercentage, ageRange, incomeCap, streamRequired, domicile)
    - TimelineStep (stepNumber, title, description, timeWindow, actionType, officialUrl)
    - ExamImportantDates (notificationRelease, applicationStart, applicationDeadline, admitCardDate, examDate, resultDate)
    - ExamSyllabusPattern (totalMarks, durationMinutes, mode, subjects, negativeMarking, questionFormat)
    - ExamDetail (id, slug, title, shortName, conductingBody, badge, icon, overview, howItWorks, benefits, eligibility, timeline, syllabusPattern, officialLinks, recommendationTags)
    - StudentProfileForRecommendation (class, stream, aspiration, familyIncome, state)
    - ExamRecommendation (examId, matchScore, matchReasons, urgencyLevel)
    
    Export all types and re-export them in shared/types.ts.
  </action>
  <verify>
    npx tsc --noEmit shared/types/exams.ts
  </verify>
  <done>
    TypeScript types compile cleanly with 100% strict type safety.
  </done>
</task>

<task type="auto">
  <name>Author Comprehensive Class-Wise Exam Dataset</name>
  <files>
    shared/data/examsData.ts
    frontend/src/data/examsData.js
  </files>
  <action>
    Write the comprehensive knowledge base with real, verified data for 20+ exams:
    - Class 5-8: Pathani Samanta PMST Stage 1, Jawahar Navodaya JNVST Class 6, NMMS (National Means-cum-Merit), AISSEE Sainik School Class 6, SOF Olympiads (NSO/IMO), NRTS Odisha.
    - Class 9-10: Pathani Samanta PMST Stage 2, JNVST Class 9 Lateral Entry, AISSEE Class 9, IOQM / PRMO Math Olympiad, Junior Science Olympiad (NSEJS), PM-YASASVI Scholarship, Vidyadhan Scholarship.
    - Class 11-12: JEE Main, JEE Advanced, NEET UG, NDA & NA (UPSC), NEST (NISER Bhubaneswar & UM-DAE CEBS), IAT (IISERs, IISc, IIT Madras BS), CUET UG, CLAT (NLUs), NATA / JEE Paper 2, ICAR AIEEA (UG), INSPIRE Scholarship (SHE - ₹80,000/yr).
    
    Each entry must contain:
    - Accurate conducting body (NTA, UPSC, BSE Odisha, NVS, NISER, etc.)
    - Exact financial stipends & educational benefits
    - Precise eligibility criteria (class, age, marks %, income limits)
    - Chronological 5-step application timeline
    - Syllabus & examination pattern details
    - Official application website URLs
    
    Provide both TypeScript version for shared/mobileapp and JavaScript version for Next.js frontend.
  </action>
  <verify>
    node -e "const { EXAMS_DATABASE } = require('./frontend/src/data/examsData.js'); console.log('Loaded exams:', EXAMS_DATABASE.length); if (EXAMS_DATABASE.length < 15) process.exit(1);"
  </verify>
  <done>
    Dataset loaded with 20+ verified examinations containing full metadata, eligibility, benefits, and timelines.
  </done>
</task>

## Success Criteria
- [ ] TypeScript interfaces compile without any syntax or type errors.
- [ ] All 20+ examinations are populated with complete, factual data.
- [ ] Frontend and shared modules export the dataset consistently.
