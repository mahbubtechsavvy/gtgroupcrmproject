import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * StreamManager
 * Manages FFmpeg processes for live RTSP to HLS conversion.
 * Ensures 1 process per camera and automatic cleanup.
 */

class StreamManager {
  constructor() {
    this.activeStreams = new Map(); // camera_id -> { process, lastRequested, path }
    this.tempDir = path.join(process.cwd(), 'public', 'temp', 'streams');
    
    // Create base temp directory if not exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async startStream(camera, decryptedPassword) {
    const cameraId = camera.id;
    const existing = this.activeStreams.get(cameraId);

    if (existing) {
      // Check if process is still running
      if (this.isProcessRunning(existing.process)) {
        existing.lastRequested = Date.now();
        return existing.path;
      } else {
        this.activeStreams.delete(cameraId);
      }
    }

    // Prepare RTSP URL
    // rtsp://admin:password@{nvr_ip}:554/cam/realmonitor?channel={channel}&subtype=1
    const rtspUrl = `rtsp://${camera.username}:${decryptedPassword}@${camera.ip_address}:${camera.port}/cam/realmonitor?channel=${camera.channel}&subtype=${camera.subtype || 1}`;
    
    const streamDir = path.join(this.tempDir, cameraId);
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }

    const playlistPath = path.join(streamDir, 'index.m3u8');
    const relativePath = `/temp/streams/${cameraId}/index.m3u8`;

    // FFmpeg arguments:
    // -i RTSP_URL -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments -hls_allow_cache 0 stream.m3u8
    const args = [
      '-i', rtspUrl,
      '-c:v', 'copy', // Don't re-encode video (save CPU)
      '-c:a', 'aac', // Encode audio to AAC for HLS
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments+append_list+omit_endlist',
      '-hls_allow_cache', '0',
      playlistPath
    ];

    // Robust check for FFMPEG_PATH
    let ffmpegPath = process.env.FFMPEG_PATH;
    
    // If not found in process.env, try to read it directly from .env.local as a fallback
    if (!ffmpegPath) {
      try {
        const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
        const match = envContent.match(/FFMPEG_PATH=(.+)/);
        if (match) ffmpegPath = match[1].trim();
      } catch (e) {
        console.error("Could not read .env.local directly:", e);
      }
    }

    ffmpegPath = ffmpegPath || 'ffmpeg';

    console.log(`Starting FFmpeg for camera ${cameraId}...`);
    console.log(`Final FFmpeg Path: ${ffmpegPath}`);
    console.log(`Full Command: ${ffmpegPath} ${args.join(' ')}`);
    const ffmpegProcess = spawn(ffmpegPath, args);

    const logStream = fs.createWriteStream(path.join(this.tempDir, `${cameraId}_error.log`), { flags: 'a' });

    ffmpegProcess.stderr.on('data', (data) => {
      // ffmpeg writes most logs to stderr
      logStream.write(`[${new Date().toISOString()}] ${data}\n`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg for camera ${cameraId} exited with code ${code}`);
      logStream.write(`[${new Date().toISOString()}] PROCESS EXITED WITH CODE ${code}\n`);
      logStream.end();
      this.activeStreams.delete(cameraId);
    });

    this.activeStreams.set(cameraId, {
      process: ffmpegProcess,
      lastRequested: Date.now(),
      path: relativePath
    });

    // Wait a bit for the first segment to be generated (optional but helps player start faster)
    await new Promise(resolve => setTimeout(resolve, 3000));

    return relativePath;
  }

  isProcessRunning(process) {
    try {
      return process.kill(0);
    } catch (e) {
      return false;
    }
  }

  stopStream(cameraId) {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      stream.process.kill('SIGKILL');
      this.activeStreams.delete(cameraId);
    }
  }

  // Cleanup old streams and files (can be run periodically)
  cleanup() {
    const TIMEOUT = 60000; // 1 minute inactivity
    const now = Date.now();

    for (const [cameraId, stream] of this.activeStreams.entries()) {
      if (now - stream.lastRequested > TIMEOUT) {
        console.log(`Stopping inactive stream for camera ${cameraId}`);
        this.stopStream(cameraId);
        
        // Optionally delete the directory
        const streamDir = path.join(this.tempDir, cameraId);
        if (fs.existsSync(streamDir)) {
          fs.rmSync(streamDir, { recursive: true, force: true });
        }
      }
    }
  }
}

// Global Singleton for Next.js (Only in single-process mode)
if (!global._streamManager) {
  global._streamManager = new StreamManager();
}

export const streamManager = global._streamManager;
