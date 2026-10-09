# Gyan Verse Frontend (Gyanaratna Platform)

A role-based, offline-first educational web application built with **Next.js 15**, **React 19**, and **Tailwind CSS**. Gyan Verse delivers interactive STEM learning, curriculum-aligned academic courses, teacher-led masterclasses, AI study assistance, and offline video streaming for students and educators.

---

## Key Features

### 🎓 Student Learning Hub
- **Learn with AI**: 24/7 intelligent study buddy with specialized pedagogical modes:
  - *Concept Explainer* (real-world analogies)
  - *Socratic Tutor* (guiding questions)
  - *Practice & Quiz* (interactive challenges)
  - *Exam Revision* (formulas and high-yield notes)
  - *Direct Answer* (structured takeaways)
  - *Voice Dictation & Speech Synthesis* for accessibility
- **Academic Courses & Curriculum**: Class-specific syllabus (Class 6 to 12) featuring video lectures, progress tracking, and chapter completion marks.
- **Skill Tracks & Masterclasses**: Micro-courses in Robotics, IoT, AI, Financial Literacy, UI/UX, and Public Speaking.
- **Gamified STEM Quests**:
  - *Big-O Runner* (Phaser 3 algorithm runner)
  - *Math Blitz* & *Science Quest*
  - Daily challenges, streak counters, XP level progression, and badges.
- **Exams, Scholarships & Leaderboard**: Competitive testing, mock tests, and peer rankings.
- **Doubt Resolution & Peer Groups**: Live doubt threads with teachers and collaborative student study groups.

### 👩‍🏫 Teacher & School Administration
- **Class & Student Management**: Enrollment, progress oversight, and performance metrics.
- **Curriculum & Lesson Builder**: Create custom modules, video lessons, and interactive quizzes.
- **Doubt Management Desk**: Real-time triage and resolution of student queries.
- **Virtual ID Cards & Certificates**: Automated generation and PDF export via `jspdf`.
- **Noticeboard & Announcements**: School-wide notifications and schedule updates.

### ⚡ Offline-First Architecture (PWA)
- **Zero-Network Usability**: Full app shell, cached courses, and quizzes work seamlessly without an active internet connection (`net::ERR_INTERNET_DISCONNECTED` safe).
- **Offline Authentication**: `StudentAuthGuard` and `OfflineSafeAuthGuard` grant instant access to local profiles and cached coursework when offline, eliminating remote auth redirect failures.
- **Local Persistence Layer**: Powered by **Dexie (IndexedDB)** with optimistic updates and background request queues (`sw.js`).
- **Offline Media & YouTube Streaming**: In-app streaming via YouTube API / HLS with automatic companion video caching and direct `.mp4` downloads.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19 |
| **Styling & UI** | Tailwind CSS v4, Radix UI primitives, Lucide React, Framer Motion |
| **Authentication** | Clerk (`@clerk/nextjs`) with offline-safe bypass guards |
| **Database & Backend** | Supabase (`@supabase/supabase-js`), Next.js Route Handlers (`/api/*`) |
| **Client Storage** | Dexie.js (IndexedDB), Service Worker Cache Storage API |
| **Game Engines** | Phaser 3 (`phaser`) for gamified interactive STEM simulations |
| **Data Visualization** | Recharts (progress analytics & performance reports) |
| **Media & Video** | YouTube IFrame API, HLS.js, YouTubei.js, Sharp |
| **Documents & Export** | jsPDF (ID cards & study certificates), react-markdown, remark-gfm |

---

## Directory Structure

```plaintext
frontend/
├── public/
│   ├── sw.js                 # PWA Service Worker (caching, sync queue, asset precache)
│   ├── manifest.json         # Web App Manifest
│   ├── offline.html          # Fallback offline document
│   ├── favicon.ico           # Application favicon
│   ├── logo.webp             # App branding
│   └── icons/                # PWA maskable and standard app icons
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # Backend endpoints (courses, quizzes, media, students)
│   │   ├── student/          # Student portal routes (courses, learn-with-ai, games)
│   │   ├── teacher/          # Teacher dashboard, classes, content, and reports
│   │   ├── layout.js         # Root layout with Theme and Clerk providers
│   │   └── page.js           # Public landing and welcome page
│   ├── student/              # Student feature components & views
│   │   ├── components/       # CourseSelection, YouTubePlayer, StudentAuthGuard
│   │   └── views/            # DashboardV2, QuizComponent, STEM views
│   ├── teacher/              # Teacher feature components
│   ├── components/           # Shared UI (InbuiltVideoPlayer, ErrorBoundary, Guards)
│   ├── hooks/                # Custom React hooks (useCourses, useApi, useOfflineData)
│   ├── lib/                  # Core utilities
│   │   ├── offlineDb.js      # Dexie IndexedDB schemas & helper methods
│   │   ├── offlineVideoManager.js # Video caching and download orchestrator
│   │   ├── offline/          # Offline repository & seed data fallbacks
│   │   ├── api.js            # Frontend HTTP client
│   │   └── supabaseClient.js # Supabase connection
│   └── i18n/                 # Multi-language translation dictionaries
├── package.json
└── next.config.mjs
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm** or **pnpm**

### 2. Environment Variables
Create a `.env` or `.env.local` file in the `frontend` folder with the following keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional AI / Chatbot Microservice
DEEPBOT_API_URL=https://your-ai-service.com
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Compiles production build |
| `npm run start` | Runs the compiled production application |
| `npm run lint` | Runs ESLint analysis |
| `npm run pwa:icons` | Regenerates PWA icons across standard sizes |

---

## Offline Testing & PWA Verification

To test offline capability locally:
1. Open Chrome DevTools (`F12`) and navigate to the **Application** tab.
2. Under **Service Workers**, verify that `sw.js` is registered and activated.
3. Switch **Network** tab throttling to **Offline** (or disconnect Wi-Fi).
4. Navigate through `/student/courses`, `/student/learn-with-ai`, or `/student/quiz`.
5. The application will serve cached app shells, local IndexedDB lessons, and fallback seed data without redirecting to Clerk's sign-in screen.
