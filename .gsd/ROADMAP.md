---
milestone: Class-Wise Examination Information & Recommendation System
version: 1.0.0
updated: 2026-10-09T15:08:00+05:30
---

# Roadmap

> **Current Phase:** Phase 1 - Domain Modeling & Comprehensive Exam Knowledge Base
> **Status:** planning

## Must-Haves (from SPEC)

- [ ] Complete typed database of 20+ examinations covering Class 5-8, Class 9-10, and Class 11-12 (PMST, JNVST, NMMS, AISSEE, Olympiads, JEE, NEET, NDA, NEST, IAT, CUET, CLAT, etc.).
- [ ] Each exam includes: Overview, Conducting Body, How It Works, Tangible Benefits & Stipends, Exact Eligibility, Step-by-Step Timeline, Syllabus & Pattern, and Official Links.
- [ ] Intelligent Recommendation Engine matching students by Class, Stream, Aspiration, Income, and State with Match % and rationale.
- [ ] Interactive Web UI at `/student/exams` with Class-wise filters, Category tabs, Status filters, Recommendation spotlight, and Rich Detail Modal.
- [ ] 3-step "Find My Perfect Exams" Recommendation Wizard.
- [ ] "My Tracked Exams" bookmarking & deadline countdown tracker.
- [ ] Navigation integration into student sidebar and header.
- [ ] Mobile app alignment with shared schema.

---

## Phases

### Phase 1: Domain Modeling & Comprehensive Exam Knowledge Base
**Status:** 🔄 In Progress
**Objective:** Define TypeScript types and build the rich canonical dataset of 20+ class-wise examinations with deep metadata, step-by-step application timelines, exact benefit figures, and syllabus structures.
**Requirements:** REQ-EXAM-DATA, REQ-EXAM-TYPES

**Plans:**
- [ ] Plan 1.1: Core Types & Comprehensive Class-Wise Exam Dataset (`shared/types/exams.ts`, `frontend/src/data/examsData.js`)
- [ ] Plan 1.2: Data Integrity & Validation Verification

---

### Phase 2: Recommendation Engine & Interactive Wizard Logic
**Status:** ⬜ Not Started
**Objective:** Develop the deterministic recommendation algorithm calculating match percentages, eligibility gates, and personalized explanations, along with the interactive 3-step recommendation wizard.
**Depends on:** Phase 1
**Requirements:** REQ-RECOM-ENGINE, REQ-WIZARD-LOGIC

**Plans:**
- [ ] Plan 2.1: Recommendation Algorithm & Eligibility Scoring Service
- [ ] Plan 2.2: Persona Verification Suite (Classes 6, 8, 10, 12 PCM/PCB/Arts/Commerce)

---

### Phase 3: Student Web Portal Implementation (`/student/exams`)
**Status:** ⬜ Not Started
**Objective:** Build the modern, responsive web interface in Next.js with Class filters, Category tabs, Search, Recommended Spotlight, Detailed Exam Modal, Interactive Roadmap Stepper, and "My Tracked Exams" system.
**Depends on:** Phase 2
**Requirements:** REQ-EXAM-UI, REQ-TIMELINE-STEPPER, REQ-TRACKER

**Plans:**
- [ ] Plan 3.1: Exam Directory Page, Filters, Search & Recommendation Spotlight
- [ ] Plan 3.2: Interactive Exam Detail Modal, Timeline Stepper, Benefit Calculator & Bookmarking
- [ ] Plan 3.3: Sidebar & Header Navigation Integration (`frontend/src/app/student/layout.js`, `Header.js`)

---

### Phase 4: Mobile App Architecture & Offline Synchronization
**Status:** ⬜ Not Started
**Objective:** Establish mobile app parity with shared types, exam viewing screen, and offline SQLite caching so rural students can access exam information without active internet.
**Depends on:** Phase 3
**Requirements:** REQ-MOBILE-EXAMS, REQ-OFFLINE-CACHE

**Plans:**
- [ ] Plan 4.1: Mobile Exam Screen Component & Shared Type Binding
- [ ] Plan 4.2: Offline Cache Repository for Exam Data

---

### Phase 5: Verification, Empirical Validation & Documentation
**Status:** ⬜ Not Started
**Objective:** End-to-end verification, Next.js build validation, accessibility testing, and comprehensive user documentation.
**Depends on:** Phase 4
**Requirements:** REQ-BUILD-VERIFY, REQ-DOCS

**Plans:**
- [ ] Plan 5.1: Build & Integrity Verification
- [ ] Plan 5.2: Release Notes & User Documentation
