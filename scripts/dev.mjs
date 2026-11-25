import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const processes = [
  {
    name: 'API',
    command: resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'),
    args: ['watch', 'server/index.ts'],
  },
  {
    name: 'WEB',
    command: resolve(projectRoot, 'node_modules/vite/bin/vite.js'),
    args: ['--port=3000', '--host=0.0.0.0'],
  },
].map(({ name, command, args }) => {
  const child = spawn(process.execPath, [command, ...args], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });
  child.on('error', (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`[${name}] exited${code === null ? '' : ` with code ${code}`}`);
      stop(code || 1);
    }
  });
  return child;
});

let stopping = false;
function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of processes) {
    if (child && child.exitCode === null && child.signalCode === null) child.kill();
  }
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));