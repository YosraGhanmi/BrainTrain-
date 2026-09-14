import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const nextBin = isWindows ? 'next.cmd' : 'next';

const child = spawn(nextBin, ['build'], {
  stdio: 'inherit',
  shell: isWindows,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=3072'].filter(Boolean).join(' '),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
