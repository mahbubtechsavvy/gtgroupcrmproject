const { spawn, execSync } = require('child_process');
const path = require('path');

// Determine if we are running in dev or production mode
const isProd = process.argv.includes('--prod');

console.log(`[GT CRM] Launching CCTV Employee Tracking & Daily Report Unified Server...`);
console.log(`[GT CRM] Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);

// 1. Detect Python Command (python vs python3)
let pythonCmd = 'python';
try {
  execSync('python --version', { stdio: 'ignore' });
} catch (e) {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    pythonCmd = 'python3';
  } catch (err) {
    console.warn('[GT CRM] WARNING: Python command not found in PATH! Will fallback to "python".');
  }
}

// 2. Start Python Flask AI Tracker
const pythonDir = path.join(__dirname, 'services', 'cctv_tracker');
console.log(`[GT CRM] [Python] Launching Flask AI Service inside ${pythonDir} using command: "${pythonCmd} app.py"...`);

const pythonProcess = spawn(pythonCmd, ['app.py'], {
  cwd: pythonDir,
  stdio: 'inherit',
  shell: true
});

pythonProcess.on('error', (err) => {
  console.error(`[GT CRM] [Python] [Error] Failed to start Python service: ${err.message}`);
});

// 3. Start Next.js App
const nextArgs = isProd ? ['next', 'start', '-p', '3005'] : ['next', 'dev', '-p', '3005'];
console.log(`[GT CRM] [Next.js] Launching Next.js on port 3005 using command: "npx ${nextArgs.join(' ')}"...`);

const nextProcess = spawn('npx', nextArgs, {
  stdio: 'inherit',
  shell: true
});

nextProcess.on('error', (err) => {
  console.error(`[GT CRM] [Next.js] [Error] Failed to start Next.js service: ${err.message}`);
});

// Clean up processes on exit
const cleanup = () => {
  console.log('\n[GT CRM] Shutting down background processes...');
  try {
    if (pythonProcess && !pythonProcess.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        pythonProcess.kill('SIGTERM');
      }
    }
  } catch (e) {}
  
  try {
    if (nextProcess && !nextProcess.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', nextProcess.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        nextProcess.kill('SIGTERM');
      }
    }
  } catch (e) {}
  
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGHUP', cleanup);
process.on('exit', cleanup);
