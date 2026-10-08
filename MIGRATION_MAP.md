# GyanVerse Web-to-Mobile Migration Map (MIGRATION_MAP.md)

This document defines the functional and structural mapping between the source Next.js web application (`frontend/`) and the target React Native mobile application (`mobileapp/`).

---

## 1. Route & Screen Mapping

| Next.js Web Route | Web Page / Component | React Native Target Screen | Mobile Navigation Stack | Purpose / Functional Scope |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `frontend/src/app/page.js` | `mobileapp/src/screens/auth/WelcomeScreen.tsx` | `AuthStack` | Landing page, branding, role selection (Student / Teacher), Sign In / Sign Up triggers |
| `/sign-in` | `@clerk/nextjs` | `mobileapp/src/screens/auth/SignInScreen.tsx` | `AuthStack` | Native authentication with Clerk (Email/Password, OAuth) |
| `/sign-up` | `@clerk/nextjs` | `mobileapp/src/screens/auth/SignUpScreen.tsx` | `AuthStack` | Native student / teacher registration |
| `/student` | `frontend/src/app/student/page.js` | `mobileapp/src/screens/student/HomeScreen.tsx` | `StudentTabNavigator` (Home Tab) | Student dashboard: daily streaks, progress overview, continue learning, quick actions, offline banner |
| `/student/courses` | `frontend/src/app/student/courses/page.js` | `mobileapp/src/screens/student/CoursesScreen.tsx` | `StudentTabNavigator` (Courses Tab) | Subject explorer, module catalog, difficulty & category filters |
| `/student/lessons` | `frontend/src/app/student/lessons/page.js` | `mobileapp/src/screens/student/LessonsListScreen.tsx` | `StudentStackNavigator` | Topic list, completed checkmarks, download buttons, lesson launcher |
| `/student/lessons/[id]` | `frontend/src/app/student/lessons/[id]/page.js` | `mobileapp/src/screens/student/LessonDetailScreen.tsx` | `StudentStackNavigator` | Lesson overview, video/audio launcher, lecture notes, interactive quiz link |
| `/student/quiz` | `frontend/src/app/student/quiz/page.js` | `mobileapp/src/screens/student/QuizScreen.tsx` | `StudentStackNavigator` | Interactive question bank, timer, option selection, offline answer caching |
| `/student/quiz/results` | `frontend/src/app/student/quiz/results/page.js` | `mobileapp/src/screens/student/QuizResultsScreen.tsx` | `StudentStackNavigator` | Score breakdown, explanations, XP rewards, sync status |
| `/student/study-buddy` | `frontend/src/app/student/study-buddy/page.js` | `mobileapp/src/screens/student/StudyBuddyScreen.tsx` | `StudentTabNavigator` (AI Tab) | AI tutor chat interface, contextual hints, voice-to-text prompt input |
| `/student/leaderboard` | `frontend/src/app/student/leaderboard/page.js` | `mobileapp/src/screens/student/LeaderboardScreen.tsx` | `StudentStackNavigator` | Class and global rankings, XP badges, weekly top learners |
| `/student/achievements` | `frontend/src/app/student/achievements/page.js` | `mobileapp/src/screens/student/AchievementsScreen.tsx` | `StudentStackNavigator` | Badges, unlockable milestones, streak trophies |
| `/student/search` | `frontend/src/app/student/search/page.js` | `mobileapp/src/screens/student/SearchScreen.tsx` | `StudentStackNavigator` | Global search across subjects, chapters, quizzes, and downloaded media |
| `/student/downloads` | (PWA Offline UI) | `mobileapp/src/screens/student/DownloadsScreen.tsx` | `StudentTabNavigator` (Library Tab) | Native offline media manager: downloaded videos/audio, storage gauge, batch delete |
| `/student/profile` | `frontend/src/app/student/profile/page.js` | `mobileapp/src/screens/student/ProfileScreen.tsx` | `StudentTabNavigator` (Profile Tab) | User profile, offline sync manual trigger, low-data mode toggle, storage management |
| `/teacher` | `frontend/src/app/teacher/page.js` | `mobileapp/src/screens/teacher/TeacherHomeScreen.tsx` | `TeacherTabNavigator` (Dashboard Tab) | Teacher dashboard: class performance metrics, quiz analytics, active assignments |
| `/teacher/classes` | `frontend/src/app/teacher/classes/page.js` | `mobileapp/src/screens/teacher/ClassesScreen.tsx` | `TeacherTabNavigator` (Classes Tab) | Manage classroom rosters, invite codes, grade levels |
| `/teacher/content` | `frontend/src/app/teacher/content/page.js` | `mobileapp/src/screens/teacher/ContentManagerScreen.tsx` | `TeacherTabNavigator` (Content Tab) | Upload/manage lesson modules, attachments, quizzes |
| `/teacher/quizzes` | `frontend/src/app/teacher/quizzes/page.js` | `mobileapp/src/screens/teacher/QuizEditorScreen.tsx` | `TeacherStackNavigator` | Create & assign interactive quizzes, review score distributions |
| `/teacher/reports` | `frontend/src/app/teacher/reports/page.js` | `mobileapp/src/screens/teacher/ReportsScreen.tsx` | `TeacherStackNavigator` | Exportable analytics, at-risk student alerts, engagement charts |

---

## 2. Component Mapping

| Web Component (React / DOM) | Source Path | Target Native Component | Target Path | Key Adaptations |
| :--- | :--- | :--- | :--- | :--- |
| `LessonVideoPlayer` | `frontend/src/components/media/LessonVideoPlayer.jsx` | `NativeLessonVideoPlayer` | `mobileapp/src/components/media/NativeLessonVideoPlayer.tsx` | Replaces HTML5 `<video>` with `expo-av` Video / Native AVPlayer; handles byte-range chunked streaming and local file playback |
| `LessonAudioPlayer` | `frontend/src/components/media/LessonAudioPlayer.jsx` | `NativeLessonAudioPlayer` | `mobileapp/src/components/media/NativeLessonAudioPlayer.tsx` | Replaces HTML5 `<audio>` with `expo-av` Sound; background audio playback support, scrubber |
| `VideoPlayer` (Modal) | `frontend/src/student/components/VideoPlayer.jsx` | `VideoPlayerModal` | `mobileapp/src/components/media/VideoPlayerModal.tsx` | Full-screen immersive native modal with orientation lock & gesture controls |
| `OfflineIndicator` | `frontend/src/components/OfflineIndicator.js` | `NativeOfflineBanner` | `mobileapp/src/components/common/NativeOfflineBanner.tsx` | Animated top banner using `@react-native-community/netinfo` status |
| `StreakCard` | `frontend/src/student/components/StreakCard.jsx` | `StreakCard` | `mobileapp/src/components/student/StreakCard.tsx` | Replaces Tailwind CSS with StyleSheet; smooth micro-animations using `react-native-reanimated` |
| `CourseCard` | `frontend/src/student/components/CourseCard.jsx` | `CourseCard` | `mobileapp/src/components/student/CourseCard.tsx` | Touch-optimized `Pressable` card with progress ring and offline download status pill |
| `QuizCard` | `frontend/src/student/components/QuizCard.jsx` | `QuizCard` | `mobileapp/src/components/student/QuizCard.tsx` | Haptic feedback on selection, accessible radio/checkbox native states |
| `DownloadButton` | `frontend/src/components/DownloadButton.jsx` | `NativeDownloadButton` | `mobileapp/src/components/media/NativeDownloadButton.tsx` | Progress ring displaying exact byte percentage download via `expo-file-system` |
| `SyncStatusBadge` | `frontend/src/components/SyncStatusBadge.jsx` | `SyncStatusBadge` | `mobileapp/src/components/common/SyncStatusBadge.tsx` | Pulsing cloud indicator (Synced / Pending / Syncing / Failed) |
| `Navbar` & `Sidebar` | `frontend/src/student/components/Navbar.jsx` | Native Bottom Tabs & Header | `mobileapp/src/navigation/StudentTabNavigator.tsx` | Replaces web DOM navigation bar with React Navigation bottom tabs and native headers |

---

## 3. State Management & Storage Mapping

| Web Technology | Web Source Files | Mobile Native Technology | Mobile Target Path | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **IndexedDB (Dexie)** | `frontend/src/lib/offlineDb.js` | **SQLite (expo-sqlite)** | `mobileapp/src/lib/storage/offlineDatabase.ts` | Mirror table schemas (`lessons`, `courses`, `quizzes`, `user_progress`, `sync_queue`, `offline_media_metadata`) |
| **Service Worker Cache** | `frontend/public/sw.js` | **Native File System** | `mobileapp/src/lib/media/nativeDownloadManager.ts` | Direct native file storage via `expo-file-system` (`FileSystem.documentDirectory + 'media/'`) |
| **localStorage (Tokens/Prefs)** | Browser `localStorage` | **Expo SecureStore & AsyncStorage** | `mobileapp/src/lib/storage/secureStorage.ts` | Sensitive auth tokens stored in iOS Keychain / Android Keystore; UI preferences in AsyncStorage |
| **Sync Engine** | `frontend/src/lib/syncEngine.js` | **Native Background Sync Engine** | `mobileapp/src/lib/sync/syncEngine.ts` | Idempotent queue processing, NetInfo network gating, exponential retry backoff |
| **Global UI State** | React Context (`AuthContext`) | **Zustand Store** | `mobileapp/src/store/useAppStore.ts` | Lightweight, performant state management without unnecessary re-renders |

---

## 4. API Endpoints & Backend Communication

The React Native application interacts directly with the existing Next.js backend API routes (`BASE_URL = http://<server-ip>:3000` or production URL):

| Endpoint | Method | Purpose | Mobile Client Service | Offline Handling |
| :--- | :--- | :--- | :--- | :--- |
| `/api/lessons` | `GET` | Fetch all lessons / filter by subject | `LessonService.getAll()` | Serve from SQLite cache if offline |
| `/api/lessons/[id]` | `GET` | Fetch lesson details & media metadata | `LessonService.getById(id)` | Serve from SQLite cache if offline |
| `/api/media/video/[id]` | `GET` (Range) | Byte-range video streaming | `NativeLessonVideoPlayer` | Stream from remote URL or play from local native path |
| `/api/media/audio/[id]` | `GET` (Range) | Byte-range audio streaming | `NativeLessonAudioPlayer` | Stream from remote URL or play from local native path |
| `/api/media/thumbnail/[id]` | `GET` | Fetch optimized lesson thumbnail | `ThumbnailService.get(id)` | Native cached image |
| `/api/quizzes` | `GET` | Fetch quiz questions by topic | `QuizService.getForLesson(id)` | Cached in SQLite |
| `/api/streak` | `GET`, `POST` | Get streak data / log daily activity | `StreakService` | Write to SQLite + enqueue `UPDATE_STREAK` in `sync_queue` |
| `/api/sync` | `POST` | Batch sync pending offline actions | `SyncEngine.processQueue()` | Triggered automatically on network reconnect |
| `/api/ai/study-buddy` | `POST` | AI tutor interactive chat | `AiService.chat(prompt)` | Disabled offline with graceful user notification |

---

## 5. Styling & Design System Mapping

| Web Tailwind / CSS Token | Mobile React Native Style / Token | Usage |
| :--- | :--- | :--- |
| `bg-slate-900` / `#0F172A` | `colors.background.primary = '#0F172A'` | App background |
| `bg-slate-800` / `#1E293B` | `colors.surface.card = '#1E293B'` | Card / Container surface |
| `bg-indigo-600` / `#4F46E5` | `colors.primary.main = '#4F46E5'` | Primary CTA buttons, active tabs |
| `text-indigo-400` / `#818CF8` | `colors.primary.light = '#818CF8'` | Accent labels, icons |
| `bg-emerald-500` / `#10B981` | `colors.success.main = '#10B981'` | Streaks, completed checkmarks |
| `bg-amber-500` / `#F59E0B` | `colors.warning.main = '#F59E0B'` | Pending sync indicator, XP badges |
| `font-sans` | `fonts.family = 'System'` / Inter | Clean modern typography |
| `rounded-xl` | `radii.xl = 16` | Card corners |
| `rounded-2xl` | `radii.xxl = 24` | Modal / Hero banner corners |
| `shadow-lg` | `shadows.card` (elevation: 4, shadowOpacity: 0.2) | Native depth and elevation |

---

## 6. Migration Sequence & Validation Status

- [ ] **Phase 1: Project Setup & Primitives** *(In Progress)*
- [ ] **Phase 2: Design System & Theme Engine**
- [ ] **Phase 3: Navigation Stacks (Auth, Student, Teacher)**
- [ ] **Phase 4: Authentication (Clerk + SecureStore)**
- [ ] **Phase 5: Student Home & Dashboard**
- [ ] **Phase 6: Courses & Lessons Catalog**
- [ ] **Phase 7: Video & Audio Chunked Range Streaming**
- [ ] **Phase 8: Native Media Downloader & Offline Storage**
- [ ] **Phase 9: Quizzes, Progress & Streaks**
- [ ] **Phase 10: Automatic Offline Sync Engine**
- [ ] **Phase 11: Teacher Portal & Management**
- [ ] **Phase 12: GyanVerse Nearby (Peer-to-Peer Transfer)**
