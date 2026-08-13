import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

const DEFAULTS = {
  memoryMb: parseInt(process.env.SANDBOX_MEMORY_MB || '256', 10),
  cpuLimit: process.env.SANDBOX_CPU_LIMIT || '0.5',
  pidsLimit: parseInt(process.env.SANDBOX_PIDS_LIMIT || '64', 10),
  timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS || '25000', 10),
  userUid: process.env.SANDBOX_USER_UID || '1000',
  secccomp: process.env.SANDBOX_SECCOMP_PROFILE || '' // optional
};

function buildDockerArgs({ image, hostSubmissionDir, workspaceTmpfsSize = '32m', cmdArgs = [] }) {
  const args = [
    'run',
    '--rm',
    '--network', 'none',
    '--memory', `${DEFAULTS.memoryMb}m`,
    '--memory-swap', `${DEFAULTS.memoryMb}m`,
    '--cpus', DEFAULTS.cpuLimit,
    '--pids-limit', `${DEFAULTS.pidsLimit}`,
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
  ];

  if (DEFAULTS.secccomp) {
    args.push('--security-opt', `seccomp=${DEFAULTS.secccomp}`);
  }

  args.push('--read-only');
  args.push('--tmpfs', `/tmp:rw,size=16m,mode=1777`);
  args.push('--tmpfs', `/workspace:rw,size=${workspaceTmpfsSize},mode=1777`);
  args.push('-v', `${hostSubmissionDir}:/submission:ro`);
  args.push('-u', `${DEFAULTS.userUid}:${DEFAULTS.userUid}`);
  args.push('--stop-timeout', '1');

  args.push(image);

  // append container command
  return args.concat(cmdArgs);
}

function runInDocker({ image, hostSubmissionDir, containerCmdArgs, timeoutMs }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(hostSubmissionDir)) {
      return reject(new Error('Submission directory not found'));
    }

    const args = buildDockerArgs({ image, hostSubmissionDir, cmdArgs: containerCmdArgs });

    const opts = {
      timeout: timeoutMs || DEFAULTS.timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    };

    const start = Date.now();
    const child = execFile('docker', args, opts, (err, stdout, stderr) => {
      const execTime = Date.now() - start;
      if (err) {
        // Distinguish between docker CLI errors (exit code null) and container-run errors
        const exitCode = err.code !== undefined ? err.code : null;
        return resolve({ error: err, stdout: stdout || '', stderr: stderr || '', exitCode, execTime });
      }
      return resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0, execTime });
    });
  });
}

export { runInDocker, DEFAULTS };
