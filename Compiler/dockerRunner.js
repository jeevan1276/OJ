import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const DEFAULTS = {
  memoryMb: parseInt(process.env.SANDBOX_MEMORY_MB || '256', 10),
  cpuLimit: process.env.SANDBOX_CPU_LIMIT || '0.5',
  pidsLimit: parseInt(process.env.SANDBOX_PIDS_LIMIT || '64', 10),
  timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS || '25000', 10),
  userUid: process.env.SANDBOX_USER_UID || '1000',
  secccomp: process.env.SANDBOX_SECCOMP_PROFILE || '' // optional
};

function buildDockerArgs({ image, hostSubmissionDir, containerName, workspaceTmpfsSize = '32m', cmdArgs = [] }) {
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

  if (containerName) {
    args.push('--name', containerName);
  }

  args.push(image);

  // append container command
  return args.concat(cmdArgs);
}

/**
 * Execute `docker stats --no-stream` on a named container to get peak memory.
 * Returns memory in MB or null if unavailable.
 */
function getContainerMemoryMb(containerName) {
  return new Promise((resolve) => {
    execFile(
      'docker',
      ['stats', '--no-stream', '--format', '{{.MemUsage}}', containerName],
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) return resolve(null);
        // Format: "12.5MiB / 256MiB" — extract first value
        const match = stdout.trim().match(/^([\d.]+)([KMGi]+)B/i);
        if (!match) return resolve(null);
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase().replace('I', '');
        let mb = value;
        if (unit === 'K' || unit === 'KIB') mb = value / 1024;
        else if (unit === 'G' || unit === 'GIB') mb = value * 1024;
        resolve(Math.round(mb * 10) / 10);
      }
    );
  });
}

function runInDocker({ image, hostSubmissionDir, containerCmdArgs, timeoutMs }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(hostSubmissionDir)) {
      return reject(new Error('Submission directory not found'));
    }

    const containerName = `oj-runner-${uuid()}`;
    const args = buildDockerArgs({ image, hostSubmissionDir, containerName, cmdArgs: containerCmdArgs });

    const opts = {
      timeout: timeoutMs || DEFAULTS.timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    };

    const start = Date.now();

    // Kick off stats polling before container starts (it will retry until container exists)
    let peakMemoryMb = null;
    const statsInterval = setInterval(async () => {
      const mem = await getContainerMemoryMb(containerName);
      if (mem !== null && (peakMemoryMb === null || mem > peakMemoryMb)) {
        peakMemoryMb = mem;
      }
    }, 200);

    const child = execFile('docker', args, opts, (err, stdout, stderr) => {
      clearInterval(statsInterval);
      const execTime = Date.now() - start;
      if (err) {
        const exitCode = err.code !== undefined ? err.code : null;
        return resolve({ error: err, stdout: stdout || '', stderr: stderr || '', exitCode, execTime, memoryUsed: peakMemoryMb });
      }
      return resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0, execTime, memoryUsed: peakMemoryMb });
    });
  });
}

export { runInDocker, DEFAULTS };
