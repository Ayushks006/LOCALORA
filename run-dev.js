// Localora development orchestrator - starts both backend and frontend concurrently
const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[32m%s\x1b[0m', '=======================================================');
console.log('\x1b[32m%s\x1b[0m', '  LOCALORA - Smart Local Tourism Business Portal');
console.log('\x1b[32m%s\x1b[0m', '  Discover Local. Experience More.');
console.log('\x1b[32m%s\x1b[0m', '=======================================================');

const isWindows = process.platform === 'win32';
const execCmd = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const backendArgs = isWindows ? ['/c', 'npm', 'run', 'dev'] : ['run', 'dev'];
const frontendArgs = isWindows ? ['/c', 'npm', 'run', 'dev'] : ['run', 'dev'];

console.log('\x1b[36m%s\x1b[0m', '[Orchestrator] Starting Backend API (port 5000)...');
const backend = spawn(execCmd, backendArgs, {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: false,
});

console.log('\x1b[35m%s\x1b[0m', '[Orchestrator] Starting Frontend Portal (port 5173)...');
const frontend = spawn(execCmd, frontendArgs, {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: false,
});

const cleanup = () => {
  console.log('\x1b[33m%s\x1b[0m', '\n[Orchestrator] Shutting down services...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
