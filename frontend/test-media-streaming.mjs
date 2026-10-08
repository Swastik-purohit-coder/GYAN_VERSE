import http from 'http';

const BASE_URL = 'http://localhost:3000';
const ALT_BASE_URL = 'http://localhost:3001';

async function getAvailableBaseUrl() {
  for (const url of [ALT_BASE_URL, BASE_URL]) {
    try {
      const res = await fetch(`${url}/api/lessons/sample-lesson-101`);
      if (res.status === 200 || res.status === 404) {
        return url;
      }
    } catch (e) {
      // try next
    }
  }
  return ALT_BASE_URL;
}

async function runTests() {
  console.log('🚀 Starting Media Streaming Integration & Performance Tests...\n');
  const baseUrl = await getAvailableBaseUrl();
  console.log(`Connected to dev server at ${baseUrl}\n`);

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

  // 1. Test Video Streaming - Initial Range (0-1023)
  console.log('--- TEST 1: Video Range Streaming (bytes=0-1023) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/sample-lesson-101`, {
      headers: { Range: 'bytes=0-1023' },
    });
    assert(res.status === 206, `Status is 206 Partial Content (received: ${res.status})`);
    assert(res.headers.get('accept-ranges') === 'bytes', `Accept-Ranges header is 'bytes'`);
    assert(res.headers.get('content-range')?.startsWith('bytes 0-1023/'), `Content-Range starts with 'bytes 0-1023/' (received: ${res.headers.get('content-range')})`);
    assert(res.headers.get('content-length') === '1024', `Content-Length is 1024 (received: ${res.headers.get('content-length')})`);
    assert(res.headers.get('content-type') === 'video/mp4', `Content-Type is 'video/mp4' (received: ${res.headers.get('content-type')})`);

    const chunk = await res.arrayBuffer();
    assert(chunk.byteLength === 1024, `Chunk buffer size exactly 1024 bytes (received: ${chunk.byteLength})`);
  } catch (e) {
    assert(false, `Video range 0-1023 error: ${e.message}`);
  }

  // 2. Test Video Streaming - Middle Range Seeking (bytes=50000-99999)
  console.log('\n--- TEST 2: Video Middle Range Seeking (bytes=50000-99999) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/sample-lesson-101`, {
      headers: { Range: 'bytes=50000-99999' },
    });
    assert(res.status === 206, `Status is 206 Partial Content (received: ${res.status})`);
    assert(res.headers.get('content-range')?.startsWith('bytes 50000-99999/'), `Content-Range starts with 'bytes 50000-99999/'`);
    assert(res.headers.get('content-length') === '50000', `Content-Length is 50000 (received: ${res.headers.get('content-length')})`);
  } catch (e) {
    assert(false, `Video seek error: ${e.message}`);
  }

  // 3. Test Video Streaming - Open-ended Range (bytes=100000-)
  console.log('\n--- TEST 3: Video Open-ended Range (bytes=100000-) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/sample-lesson-101`, {
      headers: { Range: 'bytes=100000-' },
    });
    assert(res.status === 206, `Status is 206 Partial Content (received: ${res.status})`);
    assert(res.headers.get('content-range')?.startsWith('bytes 100000-'), `Content-Range starts with 'bytes 100000-'`);
  } catch (e) {
    assert(false, `Open range error: ${e.message}`);
  }

  // 4. Test Video Streaming - Suffix Range (bytes=-1024)
  console.log('\n--- TEST 4: Video Suffix Range (bytes=-1024) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/sample-lesson-101`, {
      headers: { Range: 'bytes=-1024' },
    });
    assert(res.status === 206, `Status is 206 Partial Content (received: ${res.status})`);
    assert(res.headers.get('content-length') === '1024', `Content-Length is 1024 (received: ${res.headers.get('content-length')})`);
  } catch (e) {
    assert(false, `Suffix range error: ${e.message}`);
  }

  // 5. Test Video Streaming - Invalid / Out-of-bounds Range (bytes=99999999-)
  console.log('\n--- TEST 5: Video Out-of-bounds Range (bytes=99999999-) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/sample-lesson-101`, {
      headers: { Range: 'bytes=99999999-' },
    });
    assert(res.status === 416, `Status is 416 Range Not Satisfiable (received: ${res.status})`);
    assert(res.headers.get('content-range')?.startsWith('bytes */'), `Content-Range format is 'bytes */total' (received: ${res.headers.get('content-range')})`);
  } catch (e) {
    assert(false, `Invalid range error: ${e.message}`);
  }

  // 6. Test Audio Streaming with Range
  console.log('\n--- TEST 6: Audio Streaming (bytes=0-2047) ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/audio/sample-lesson-101`, {
      headers: { Range: 'bytes=0-2047' },
    });
    assert(res.status === 206, `Status is 206 Partial Content (received: ${res.status})`);
    assert(res.headers.get('content-type') === 'audio/mpeg', `Content-Type is 'audio/mpeg' (received: ${res.headers.get('content-type')})`);
    assert(res.headers.get('content-length') === '2048', `Content-Length is 2048 (received: ${res.headers.get('content-length')})`);
  } catch (e) {
    assert(false, `Audio streaming error: ${e.message}`);
  }

  // 7. Test Thumbnail Streaming
  console.log('\n--- TEST 7: Thumbnail Streaming ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/thumbnail/sample-lesson-101`);
    assert(res.status === 200, `Status is 200 OK (received: ${res.status})`);
    assert(res.headers.get('content-type')?.includes('image/'), `Content-Type is an image type (received: ${res.headers.get('content-type')})`);
    assert(res.headers.get('cache-control')?.includes('immutable'), `Cache-Control includes 'immutable' for performance`);
  } catch (e) {
    assert(false, `Thumbnail streaming error: ${e.message}`);
  }

  // 8. Test Lesson Metadata API
  console.log('\n--- TEST 8: Lesson Metadata Endpoint ---');
  try {
    const res = await fetch(`${baseUrl}/api/lessons/sample-lesson-101`);
    assert(res.status === 200, `Status is 200 OK (received: ${res.status})`);
    const json = await res.json();
    assert(json.id === 'sample-lesson-101', `Lesson ID matches (received: ${json.id})`);
    assert(json.videoUrl === '/api/media/video/sample-lesson-101', `videoUrl points to streaming endpoint (received: ${json.videoUrl})`);
    assert(json.audioUrl === '/api/media/audio/sample-lesson-101', `audioUrl points to streaming endpoint (received: ${json.audioUrl})`);
    assert(json.thumbnail === '/api/media/thumbnail/sample-lesson-101', `thumbnail points to streaming endpoint (received: ${json.thumbnail})`);
  } catch (e) {
    assert(false, `Lesson metadata error: ${e.message}`);
  }

  // 9. Test Security / Path Traversal Prevention
  console.log('\n--- TEST 9: Security Path Traversal Protection ---');
  try {
    const res = await fetch(`${baseUrl}/api/media/video/..%2F..%2Fpackage.json`);
    // Should safely sanitize or return 404, NEVER expose arbitrary system files
    assert(res.status === 404 || res.status === 400, `Path traversal attempt blocked safely (received: ${res.status})`);
  } catch (e) {
    assert(false, `Security test error: ${e.message}`);
  }

  // 10. Summary
  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
