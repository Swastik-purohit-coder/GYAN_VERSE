import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * HLS Adaptive Bitrate Transcoding Utility for Gyanaratna
 * Converts MP4 / WebM / MKV videos to multi-variant HLS:
 * - master.m3u8
 *   ├── 360p (low bandwidth mobile)
 *   ├── 480p (standard mobile / tablet)
 *   └── 720p (high quality laptop / desktop)
 */

function checkFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

export async function transcodeToHls(inputFilePath, outputDirId) {
  const cwd = process.cwd();
  const rootDir = path.resolve(cwd, '..');
  const hlsBaseDir = path.join(rootDir, 'content', 'media', 'hls');

  if (!fs.existsSync(inputFilePath)) {
    console.error(`❌ Input file does not exist: ${inputFilePath}`);
    return false;
  }

  const targetDir = path.join(hlsBaseDir, outputDirId);
  fs.mkdirSync(targetDir, { recursive: true });

  if (!checkFfmpeg()) {
    console.warn(`
⚠️ FFmpeg is not detected in your system environment PATH.
To enable HLS multi-bitrate generation:
  - Windows: winget install Gyan.FFmpeg or download from https://ffmpeg.org
  - Linux: sudo apt install ffmpeg
  - macOS: brew install ffmpeg

Note: Range-request streaming for MP4 / WebM / MP3 works immediately without FFmpeg!
    `);
    return false;
  }

  console.log(`🎬 Transcoding ${inputFilePath} to multi-bitrate HLS in ${targetDir}...`);

  // FFmpeg command to generate 360p, 480p, and 720p streams with HLS segments
  const ffmpegArgs = [
    '-i', inputFilePath,
    '-filter_complex',
    '[0:v]split=3[v1][v2][v3];' +
    '[v1]scale=w=640:h=360[v1out];' +
    '[v2]scale=w=854:h=480[v2out];' +
    '[v3]scale=w=1280:h=720[v3out]',
    
    // 360p Stream
    '-map', '[v1out]', '-c:v:0', 'libx264', '-b:v:0', '800k', '-maxrate:v:0', '856k', '-bufsize:v:0', '1200k',
    '-map', '0:a', '-c:a:0', 'aac', '-b:a:0', '64k',
    
    // 480p Stream
    '-map', '[v2out]', '-c:v:1', 'libx264', '-b:v:1', '1400k', '-maxrate:v:1', '1498k', '-bufsize:v:1', '2100k',
    '-map', '0:a', '-c:a:1', 'aac', '-b:a:1', '96k',
    
    // 720p Stream
    '-map', '[v3out]', '-c:v:2', 'libx264', '-b:v:2', '2800k', '-maxrate:v:2', '2996k', '-bufsize:v:2', '4200k',
    '-map', '0:a', '-c:a:2', 'aac', '-b:a:2', '128k',

    // HLS Segment parameters
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', path.join(targetDir, 'stream_%v_seq%03d.ts'),
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
    path.join(targetDir, 'stream_%v.m3u8')
  ];

  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ HLS Transcoding complete: ${path.join(targetDir, 'master.m3u8')}`);
        resolve(true);
      } else {
        console.error(`❌ FFmpeg process exited with code ${code}`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error('❌ FFmpeg process error:', err.message);
      resolve(false);
    });
  });
}

// CLI execution helper
if (process.argv[2]) {
  const inputFile = path.resolve(process.argv[2]);
  const baseName = path.basename(inputFile, path.extname(inputFile));
  const outputId = process.argv[3] || baseName;
  transcodeToHls(inputFile, outputId);
}
