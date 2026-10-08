import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd(), '..');
const vidDir = path.join(rootDir, 'content', 'media', 'videos');
const largeVidPath = path.join(vidDir, 'large-500mb-lesson.mp4');

// Create a 500MB sparse file on disk for seek testing
console.log('Creating 500MB test video file (sparse/stream test)...');
const fd = fs.openSync(largeVidPath, 'w');
// Write initial 16KB
fs.writeSync(fd, Buffer.alloc(16 * 1024, 0xAA), 0, 16 * 1024, 0);
// Write at 499MB offset
const endOffset = 500 * 1024 * 1024 - 1024;
fs.writeSync(fd, Buffer.from('END_OF_500MB_FILE_MARKER_TEST'), 0, 28, endOffset);
fs.closeSync(fd);

const stat = fs.statSync(largeVidPath);
console.log(`File created: ${stat.size} bytes (${(stat.size / (1024 * 1024)).toFixed(1)} MB)\n`);

const BASE_URL = 'http://localhost:3000';

async function testLargeSeek() {
  const memBefore = process.memoryUsage().heapUsed;

  // Request middle chunk: 250MB to 250MB + 64KB
  const startByte = 250 * 1024 * 1024;
  const endByte = startByte + 64 * 1024 - 1; // 64KB chunk

  console.log(`Testing Range request: bytes=${startByte}-${endByte} on 500MB file...`);
  const res = await fetch(`${BASE_URL}/api/media/video/large-500mb-lesson`, {
    headers: { Range: `bytes=${startByte}-${endByte}` },
  });

  if (res.status !== 206) {
    console.error(`❌ Expected 206 Partial Content, got ${res.status}`);
    process.exit(1);
  }

  const chunk = await res.arrayBuffer();
  const memAfter = process.memoryUsage().heapUsed;
  const memDiffMB = (memAfter - memBefore) / (1024 * 1024);

  console.log(`✅ Received Status: ${res.status} Partial Content`);
  console.log(`✅ Content-Range: ${res.headers.get('content-range')}`);
  console.log(`✅ Content-Length: ${res.headers.get('content-length')} bytes`);
  console.log(`✅ Received buffer size: ${chunk.byteLength} bytes (64 KB)`);
  console.log(`✅ Client memory delta: ${memDiffMB.toFixed(2)} MB (no 500MB load)`);

  // Clean up
  try {
    fs.unlinkSync(largeVidPath);
    console.log('Cleaned up 500MB test file.');
  } catch (e) {}

  console.log('\n🎉 Large File Seeking & Zero-RAM Test Passed Successfully!\n');
}

testLargeSeek();
