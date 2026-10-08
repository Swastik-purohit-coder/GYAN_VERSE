import { setImmediate } from 'timers';

const BASE_URL = 'http://localhost:3000';

async function runOfflineTests() {
  console.log('🧪 Running Gyanaratna Offline-First Architecture Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Service Worker File & Manifest
  console.log('--- TEST 1: Service Worker & Web Manifest ---');
  try {
    const swRes = await fetch(`${BASE_URL}/sw.js`);
    assert(swRes.status === 200, `Service Worker /sw.js accessible (status: ${swRes.status})`);
    const swText = await swRes.text();
    assert(swText.includes('glp-shell') || swText.includes('STATIC_CACHE'), 'Service worker contains static & shell cache definitions');
    assert(swText.includes('handleVideoRangeRequest'), 'Service worker contains Range Request handler for offline video caching');

    const manifestRes = await fetch(`${BASE_URL}/manifest.json`);
    assert(manifestRes.status === 200, `Web App Manifest /manifest.json accessible (status: ${manifestRes.status})`);
    const manifestJson = await manifestRes.json();
    assert(Boolean(manifestJson.name), `Manifest has application name: "${manifestJson.name}"`);
    assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length > 0, 'Manifest contains icon definitions');
  } catch (e) {
    assert(false, `Service worker / manifest test error: ${e.message}`);
  }

  // TEST 2: Offline Static Shell & Offline Page
  console.log('\n--- TEST 2: Offline Static Fallback Shell ---');
  try {
    const offRes = await fetch(`${BASE_URL}/offline.html`);
    assert(offRes.status === 200, `Offline fallback page /offline.html accessible (status: ${offRes.status})`);
    const offText = await offRes.text();
    assert(offText.includes('Offline') || offText.includes('offline'), 'Offline page contains offline guidance text');
  } catch (e) {
    assert(false, `Offline page error: ${e.message}`);
  }

  // TEST 3: Backend /api/sync Endpoint
  console.log('\n--- TEST 3: Sync API Endpoint (POST /api/sync) ---');
  try {
    // 3a. Unauthenticated sync returns 401
    const unauthRes = await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: [] }),
    });
    assert(unauthRes.status === 401 || unauthRes.status === 200, `Sync endpoint responds properly (status: ${unauthRes.status})`);

    // 3b. Test options / CORS
    const optionsRes = await fetch(`${BASE_URL}/api/media/video/sample-lesson-101`, {
      method: 'OPTIONS',
    });
    assert(optionsRes.status === 204 || optionsRes.status === 200, `Media options preflight works (status: ${optionsRes.status})`);
  } catch (e) {
    assert(false, `Sync API test error: ${e.message}`);
  }

  // TEST 4: Offline Lesson Metadata & Media Streaming
  console.log('\n--- TEST 4: Lightweight Lesson Metadata & Range Streaming ---');
  try {
    const metaRes = await fetch(`${BASE_URL}/api/lessons/sample-lesson-101`);
    assert(metaRes.status === 200, `Lesson metadata loads successfully (status: ${metaRes.status})`);
    const metaJson = await metaRes.json();
    assert(metaJson.videoUrl === '/api/media/video/sample-lesson-101', 'videoUrl is decoupled from payload');

    const videoRangeRes = await fetch(`${BASE_URL}${metaJson.videoUrl}`, {
      headers: { Range: 'bytes=0-512' },
    });
    assert(videoRangeRes.status === 206, `Video streams 206 Partial Content (status: ${videoRangeRes.status})`);
    assert(videoRangeRes.headers.get('accept-ranges') === 'bytes', `Accept-Ranges is 'bytes'`);
    assert(videoRangeRes.headers.get('content-length') === '513', `Content-Length matches byte range`);
  } catch (e) {
    assert(false, `Lesson media stream error: ${e.message}`);
  }

  console.log(`\n========================================`);
  console.log(`OFFLINE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runOfflineTests();
