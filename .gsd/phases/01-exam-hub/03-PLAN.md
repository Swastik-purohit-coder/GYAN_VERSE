---
phase: 3
plan: 1
wave: 3
gap_closure: false
---

# Plan 3.1: Student Web Portal Implementation (`/student/exams`)

## Objective
Build a modern, interactive web experience for Gyan Verse students to discover exams class-wise, view step-by-step timelines, understand benefits and eligibility, run the recommendation wizard, bookmark tracked exams, and access official application portals.

## Context
Load these files for context:
- .gsd/SPEC.md
- frontend/src/app/student/layout.js
- frontend/src/components/Header.js
- frontend/src/data/examsData.js
- frontend/src/lib/recommendationEngine.js

## Tasks

<task type="auto">
  <name>Build Main Exam Hub Page and Components</name>
  <files>
    frontend/src/app/student/exams/page.js
    frontend/src/components/exams/ExamCard.js
    frontend/src/components/exams/ExamDetailModal.js
    frontend/src/components/exams/RecommendationWizardModal.js
    frontend/src/components/exams/ExamTimelineStepper.js
  </files>
  <action>
    Create the responsive Next.js page at `frontend/src/app/student/exams/page.js`:
    1. Hero Section:
       - Title: "Exams & Scholarships Hub"
       - Subtitle: "Class-wise national & state entrance exams, merit scholarships, and admissions guide"
       - Metrics Banner: Total active exams, available scholarships (₹ crores), upcoming deadlines
       - "Find My Perfect Exams" Wizard CTA button
    2. Interactive Filters:
       - Class Brackets: "All Classes", "Classes 5–8 (Scholarships & Foundation)", "Classes 9–10 (Boards & Talent)", "Classes 11–12 (Career Entrances)"
       - Specific Class Filter (Class 5, 6, 7, 8, 9, 10, 11, 12)
       - Category Filter Tabs: "All", "Scholarships & Aid", "School Admissions", "Engineering", "Medical", "Defense", "Research & Pure Science", "Central Universities", "Law & Others"
       - Status Switcher: "All", "Applications Open", "Upcoming Soon", "My Tracked Exams"
       - Real-time search by exam name, conducting body, or keywords
    3. Personalized Recommendations Spotlight:
       - Displays top recommended exams based on the logged-in student's class and profile
       - Shows Match Score badge (e.g. 98% Match) and reason tag
    4. Exam Card Component (`ExamCard.js`):
       - Conducting body, category pill, class eligibility tag
       - Tangible Benefit Highlight pill (e.g., "₹12,000/yr Stipend", "100% Free Boarding", "₹80,000/yr DISHA")
       - Next Important Date with live countdown / urgency badge
       - "View Details & Steps" button and "Track / Bookmark" button
    5. Rich Exam Detail Modal (`ExamDetailModal.js`):
       - Full screen or slide-over drawer modal
       - Tabs:
         - "Overview & How It Works": Plain-English explanation, conducting body, mode, purpose
         - "Benefits & Perks": Detailed financial stipend, fee waiver, college seats, reservations
         - "Eligibility Criteria": Class, age, marks %, income cap, subjects checklist
         - "Application Steps & Timeline": Visual interactive stepper (`ExamTimelineStepper.js`) showing Step 1 Docs -> Step 2 Register -> Step 3 Admit Card -> Step 4 Exam -> Step 5 Results & Counseling
         - "Syllabus & Pattern": Subject weightages, question format, marks, duration, negative marking
         - "Official Links": Direct link to official application portal with safety disclaimer
    6. Recommendation Wizard Modal (`RecommendationWizardModal.js`):
       - 3-step interactive questionnaire:
         - Step 1: Select Your Current Class
         - Step 2: Select Your Stream / Subjects
         - Step 3: What is Your Primary Goal? (Scholarship/Financial Aid, Engineering, Medical, Defense, Research, Central Univs, Talent Olympiad)
       - Instantly filters and ranks the exam directory with personalized match explanations.
    7. Offline / Local Storage Tracking:
       - Save tracked exams to `localStorage` ('tracked_exams_list') with offline resilience.
  </action>
  <verify>
    npm run build --prefix frontend
  </verify>
  <done>
    Frontend builds cleanly with no React/Next.js syntax or compilation errors.
  </done>
</task>

<task type="auto">
  <name>Integrate Exam Hub into Student Navigation</name>
  <files>
    frontend/src/app/student/layout.js
    frontend/src/components/Header.js
  </files>
  <action>
    1. Update `frontend/src/app/student/layout.js`:
       - Add `{ href: "/student/exams", label: "Exams & Scholarships", icon: Award }` to `makeNavItems` so it appears in the student sidebar.
    2. Update `frontend/src/components/Header.js`:
       - Ensure `/student/exams` is recognized under `isStudentShell` so the unified student header renders properly.
  </action>
  <verify>
    powershell -Command "Select-String -Path 'frontend/src/app/student/layout.js' -Pattern '/student/exams'"
  </verify>
  <done>
    Navigation items updated and verified in student layout and header.
  </done>
</task>

## Success Criteria
- [ ] Student can navigate to `/student/exams` from the sidebar and header.
- [ ] All filters, search, modal detail views, and recommendation wizard work smoothly without runtime errors.
- [ ] Next.js production build succeeds.
