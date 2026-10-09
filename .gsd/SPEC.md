# SPEC.md — Class-Wise Examination & Scholarship Information System with Recommendation Engine

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: SPEC is finalized. Ready for Phase Planning and Execution.

---

## 1. Vision

Empower every student on Gyan Verse (from Class 5 foundation learners to Class 12 career aspirants) with an intelligent, accessible, and comprehensive Examination & Scholarship Information Hub. Many talented students—especially in rural and underserved areas—miss out on life-changing opportunities like Pathani Samanta, Jawahar Navodaya (JNVST), NMMS (Means-cum-Merit), Sainik School, NEST, IAT, and NDA simply because they do not know what exams exist, how they work, what stipends/benefits they offer, or when to apply. This system provides class-wise exam discovery, detailed step-by-step application timelines, benefit breakdowns, syllabus/pattern guides, and an automated recommendation engine that matches students with the right exams based on their class, stream, goals, and eligibility.

---

## 2. Core Goals

1. **Class-Wise Comprehensive Exam Catalogue**:
   - **Classes 5 to 8 (Foundation & Scholarships)**: Pathani Samanta Mathematics Scholarship Test (PMST Stage I), Jawahar Navodaya Vidyalaya Selection Test (JNVST Class 6 entry), National Means-cum-Merit Scholarship (NMMSS / CUM Merits Class 8), All India Sainik Schools Entrance Exam (AISSEE Class 6), Science & Math Olympiads (SOF NSO/IMO, Silverzone), State Rural Talent Searches (NRTS).
   - **Classes 9 & 10 (Secondary & Board Talent)**: Pathani Samanta (PMST Stage II), JNVST Lateral Entry (Class 9 & 11), AISSEE (Class 9), National Talent Search (NTSE / State Talent Searches), Indian Olympiad Qualifier in Mathematics (IOQM / PRMO), Junior Science Olympiad (NSEJS), PM-YASASVI scholarship.
   - **Classes 11 & 12 (Senior Secondary & Career Entrances)**:
     - **Engineering**: JEE Main, JEE Advanced, State CETs (OJEE, MHT-CET, WBJEE, KCET), BITSAT.
     - **Medicine & Healthcare**: NEET UG (MBBS, BDS, AYUSH, Nursing).
     - **Armed Forces & Defense**: NDA & NA (UPSC Army, Navy, Air Force officer entry).
     - **Pure Science & Research**: NEST (NISER Bhubaneswar & UM-DAE CEBS Mumbai with DISHA scholarship of ₹80,000/yr), IAT (IISERs, IISc Bangalore, IIT Madras BS Medical Sciences).
     - **Central Universities & Humanities/Commerce**: CUET UG (DU, BHU, JNU, Jamia, 250+ universities), CLAT (24 National Law Universities for 5-yr BA/BBA LLB).
     - **Architecture & Agriculture**: NATA / JEE Paper 2, ICAR AIEEA (UG).
     - **Higher Education Scholarships**: INSPIRE Scholarship for Higher Education (SHE - ₹80,000/yr), Central Sector Scheme.

2. **In-Depth Exam Details & "How It Works" Guidance**:
   - Plain-language explanation of conducting bodies, exam mode, frequency, and purpose.
   - Transparent breakdown of tangible benefits: exact monthly/annual scholarship amounts, free boarding/schooling, fee waivers, college seats, reservations.
   - Explicit eligibility checklist: required class, age brackets, minimum marks %, income thresholds, and subject combinations.
   - Step-by-step roadmap & application guide: Document checklist, registration steps, admit card rules, exam day guidelines, counseling & selection steps.
   - Syllabus and exam pattern: Subject distribution, question format, marking scheme, negative marking, duration.
   - Verified official links, notification downloads, and sample paper access.

3. **Intelligent Recommendation Engine**:
   - Automated profiling based on student's active class, stream (PCM, PCB, Commerce, Arts, Foundation), primary career aspirations, and financial criteria.
   - Algorithmic Match Score (e.g., "98% Match") and human-readable explanation ("High match because you are in Class 12 PCM aiming for Pure Science & Research").
   - Interactive 3-step "Find My Perfect Exams" Wizard for quick assessment.
   - Urgency & timeline indicators: Live countdown for open registrations and upcoming exam dates.

4. **Interactive Student Hub & Persistence**:
   - Modern, responsive web interface at `/student/exams` with category pills, class filters, search bar, and deadline calendar.
   - "My Tracked Exams" (bookmarking/saving exams with deadline alerts, synced across offline IndexedDB and Supabase profile).
   - Seamless parity planned for the React Native mobile app (`mobileapp/src/screens/student/ExamsScreen.tsx`).

---

## 3. Non-Goals (Out of Scope for this Feature)

- Processing live financial transactions or charging fees for external exam registrations (we provide direct links to official government/conducting portals).
- Replacing official exam conducting portals (we guide and direct, not substitute government portals like NTA, BSE, UPSC).
- Live proctored examinations for official government certifications (mock practice quizzes exist in the platform's quiz module, not official exam administration).

---

## 4. Constraints

- **Offline-First Resilience**: Exam directory and bookmarked exams must be viewable offline using cached local data (IndexedDB/Dexie on Web, SQLite on Mobile).
- **Zero Breaking Changes**: Must integrate smoothly into existing Next.js App Router (`frontend/src/app/student/`) and existing Clerk authentication / Supabase schema without disrupting active student features.
- **Accurate Ground Truth**: All dates, stipend amounts, age criteria, and official URLs must reflect real Indian examination standards (e.g. BSE Odisha PMST, NVS JNVST, MoE NMMSS, NTA JEE/NEET/CUET, UPSC NDA, NISER NEST, IISER IAT).

---

## 5. Success Criteria

- [ ] Complete typed exam dataset created with 20+ comprehensive class-wise national and state examinations and scholarships.
- [ ] Recommendation engine implemented with deterministic scoring based on Class, Stream, Aspiration, Income, and State.
- [ ] Responsive Next.js Web UI created at `/student/exams` with search, filter by class (5-8, 9-10, 11-12), category filters, recommendation highlights, and detailed modal/drawer.
- [ ] Interactive timeline stepper, document checklist, and benefit calculator integrated into exam detail views.
- [ ] "My Tracked Exams" bookmarking feature functioning offline and online.
- [ ] Navigation integrated into Student Sidebar (`Header.js` and `frontend/src/app/student/layout.js`).
- [ ] Mobile app data contract and architecture aligned with `shared/` types.

---

*Last updated: 2026-10-09*
