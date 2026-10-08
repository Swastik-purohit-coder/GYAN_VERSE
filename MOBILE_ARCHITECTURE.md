# GyanVerse Mobile Architecture (MOBILE_ARCHITECTURE.md)

## 1. Overview & System Design

The GyanVerse mobile application is built using **React Native with Expo** (Managed workflow with prebuild capability) and TypeScript. It is designed from the ground up for **low-end Android devices, slow or intermittent internet connections, and complete offline capability**.

The mobile application connects directly to the existing Next.js backend (`frontend/src/app/api/*`) without requiring any duplicate backend or breaking changes to the web application.

```
┌────────────────────────────────────────────────────────┐
│               GyanVerse Mobile UI Layer                │
│     (React Native, Reanimated, Lucide Icons, Theme)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Navigation Architecture                │
│  (React Navigation: AuthStack, StudentTabs, Modals)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Application Services                   │
│   (AuthService, LessonService, MediaService, Sync)     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼──────────────┐ ┌─────────▼──────────────┐
│     Offline Repository      │ │     Online API Client  │
│  (SQLite + SecureStore)     │ │  (Axios / Fetch + JWT) │
└──────────────┬──────────────┘ └─────────┬──────────────┘
               │                          │
┌──────────────▼──────────────┐           │
│   Native Media Downloader   │           │
│ (expo-file-system + expo-av)│           │
└──────────────┬──────────────┘           │
               │                          │
┌──────────────▼──────────────────────────▼──────────────┐
│           Existing Next.js Backend & API               │
│          (Range 206 Streaming, Supabase, Sync)         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Expo SDK 52+ / React Native 0.76+ | Superior developer velocity, modern architecture (New Architecture enabled), prebuild ready for native custom modules |
| **Language** | TypeScript (Strict mode) | Type safety, code reusability, shared types with backend |
| **Navigation** | `@react-navigation/native` (Stack + Bottom Tabs) | Industry-standard native transition performance and gesture handling |
| **State Management** | `zustand` | Ultra-lightweight (1kB), minimal boilerplate, zero unnecessary re-renders on low-RAM devices |
| **Authentication** | `@clerk/clerk-expo` + `expo-secure-store` | Seamless parity with Next.js Clerk auth; secure token storage in iOS Keychain / Android Keystore |
| **Offline Database** | `expo-sqlite` (SQLite) | ACID-compliant local SQL storage with indexing; direct replacement for web IndexedDB (Dexie) |
| **Media Playback** | `expo-av` | Native video & audio playback with hardware acceleration, byte-range streaming support, and background audio |
| **Media Storage** | `expo-file-system` | Low-overhead native chunk downloader and local filesystem management |
| **Network Monitoring**| `@react-native-community/netinfo` | Accurate network type and connection quality detection for automatic background sync gating |
| **Styling** | React Native `StyleSheet` + Theme Tokens | Maximum performance on low-end mobile devices without runtime CSS parsing overhead |

---

## 3. Navigation Architecture

The navigation is structured into separate role-based and authentication-guarded stacks:

```
RootNavigator
│
├── AuthStack (Unauthenticated)
│   ├── WelcomeScreen
│   ├── SignInScreen
│   └── SignUpScreen
│
├── StudentRoot (Authenticated Student Role)
│   ├── StudentTabNavigator (Bottom Tabs)
│   │   ├── HomeTab (HomeScreen)
│   │   ├── CoursesTab (CoursesScreen)
│   │   ├── DownloadsTab (DownloadsScreen / Offline Library)
│   │   ├── StudyBuddyTab (StudyBuddyScreen / AI Tutor)
│   │   └── ProfileTab (ProfileScreen)
│   │
│   └── StudentStackNavigator (Push Screens & Modals)
│       ├── LessonsListScreen
│       ├── LessonDetailScreen
│       ├── VideoPlayerModal (Full-screen native player)
│       ├── QuizScreen
│       ├── QuizResultsScreen
│       ├── LeaderboardScreen
│       ├── AchievementsScreen
│       └── SearchScreen
│
└── TeacherRoot (Authenticated Teacher Role)
    └── TeacherTabNavigator (Bottom Tabs)
        ├── TeacherHomeScreen
        ├── ClassesScreen
        ├── ContentManagerScreen
        ├── QuizEditorScreen
        └── ReportsScreen
```

---

## 4. Offline-First Architecture

### 4.1 Native SQLite Database Schema
The mobile app initializes an embedded SQLite database (`gyanverse_offline.db`) storing:

1. **`courses`**: Cached course catalogs, metadata, subject groupings.
2. **`lessons`**: Lesson metadata, subject associations, duration, offline availability flags, local media file paths.
3. **`user_progress`**: Completed lessons, watch progress in seconds, last accessed timestamp.
4. **`quizzes`**: Questions, multiple-choice options, correct explanations.
5. **`quiz_submissions`**: Locally submitted quiz attempts waiting for sync or review.
6. **`sync_queue`**: Idempotent mutations queued while offline (`id`, `action`, `payload`, `timestamp`, `retryCount`, `status`).
7. **`offline_media`**: Metadata of all downloaded video and audio files (`lessonId`, `localUri`, `fileSizeBytes`, `downloadedAt`, `mediaType`).

### 4.2 Data Flow Hierarchy (Cache-First with Background Revalidation)
```
UI Component Requests Data (e.g. Lesson List)
               │
               ▼
   Check SQLite Local Cache
   ┌───────────┴───────────┐
   │                       │
Cache Hit               Cache Miss
   │                       │
Render immediately         Render Skeleton / Loader
   │                       │
If Online:                 Fetch from API
Fetch fresh data           ┌───────┴───────┐
in background              │               │
   │                    Success          Failure
Update SQLite           │               │
& update UI             Save to SQLite  Show Offline Message
```

---

## 5. Offline Media & Range Streaming Architecture

### 5.1 Online Streaming (Low-RAM Byte Range 206)
- The mobile video/audio player requests media from the Next.js API: `/api/media/video/[id]`.
- The Next.js backend responds with `206 Partial Content` in chunks (typically 512KB to 2MB).
- `expo-av` buffers only the current playback window and discards played chunks from RAM.

### 5.2 Native Downloading & Storage
- When a student taps "Download Lesson":
  1. `expo-file-system` creates a resumable download task (`createDownloadResumable`).
  2. The file is written incrementally to the device's native sandboxed directory:
     `${FileSystem.documentDirectory}media/lesson_${lessonId}.mp4`
  3. Download progress is broadcast via event emitters to update UI progress indicators.
  4. Upon completion, a record is added to `offline_media` in SQLite, marking the lesson as `AVAILABLE_OFFLINE`.
  5. The video player automatically switches source to the local `file://` URI when offline or downloaded.

---

## 6. Offline Synchronization Engine

The sync engine mirrors the Next.js web application's idempotent multi-operation batch endpoint (`POST /api/sync`).

### 6.1 Idempotent Sync Operations
- `UPDATE_LESSON_PROGRESS`: `{ lessonId, completed, progressSeconds, updatedAt }`
- `SUBMIT_QUIZ_RESPONSE`: `{ quizId, lessonId, score, answers, completedAt }`
- `UPDATE_STREAK`: `{ date, activityType, count }`

### 6.2 Network Quality Gating
- Background sync is **not triggered aggressively** on every micro-network flicker.
- `@react-native-community/netinfo` monitors connection state:
  - If network is unstable or slow cellular, sync is deferred.
  - When a stable Wi-Fi or healthy cellular connection is detected, the `SyncEngine` processes pending items in batch.
  - Uses exponential backoff on server errors (`2s`, `4s`, `8s`, `16s`, max `60s`).

---

## 7. Security & Permissions

### 7.1 Token & Session Security
- Auth tokens (JWTs) and user credentials are stored exclusively in **Expo SecureStore** (hardware-backed Keychain on iOS, KeyStore encrypted SharedPreferences on Android).
- Zero plain-text token storage in AsyncStorage or global JavaScript variables.

### 7.2 Native Permissions
| Permission | Target OS | Usage |
| :--- | :--- | :--- |
| `INTERNET` | Android / iOS | API communication & online streaming |
| `ACCESS_NETWORK_STATE` | Android | Network connectivity detection |
| `WRITE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE` | Android (Legacy) | Managing offline media storage |
| `WAKE_LOCK` | Android | Seamless background audio playback |
| `NEARBY_WIFI_DEVICES` | Android (Future) | GyanVerse Nearby peer-to-peer lesson sharing |

---

## 8. Error Handling & Recovery

1. **Network Failures**: Transparently fall back to SQLite cached data with an unobtrusive `NativeOfflineBanner`.
2. **Media Playback Errors**: If a remote stream fails due to sudden network loss, prompt the user to switch to downloaded offline version if available.
3. **Database Corruption Guard**: SQLite migrations with transactional rollback.
4. **Crash Reporting & Telemetry**: Graceful boundary catches with user-friendly retry states.
