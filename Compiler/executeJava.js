import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { runInDocker, DEFAULTS } from './dockerRunner.js';

const __dirname = path.resolve();
const runsDir = path.join(__dirname, 'runs');
if (!fs.existsSync(runsDir)) fs.mkdirSync(runsDir, { recursive: true });

const RUNNER_IMAGE = process.env.SANDBOX_RUNNER_IMAGE || 'oj-runner:latest';

const copyToRunDir = (srcPath, destDir) => {
  const base = path.basename(srcPath);
  const dest = path.join(destDir, base);
  fs.copyFileSync(srcPath, dest);
  return base;
};

const executeJava = async (filePath, inputFilePath = null) => {
  const jobId = path.basename(filePath, '.java') || 'Solution';
  const runId = uuid();
  const runPath = path.join(runsDir, runId);
  fs.mkdirSync(runPath, { recursive: true });

  const srcBase = copyToRunDir(filePath, runPath); // typically Solution.java
  let inputBase = null;
  if (inputFilePath) inputBase = copyToRunDir(inputFilePath, runPath);

  // preserve Java's compile/run timeouts: 10s compile, 15s run
  const containerCmd = [
    '/bin/sh',
    '-c',
    `timeout 10s javac "/submission/${srcBase}" -d /workspace 2>/workspace/compile.err; COMPILE_STATUS=$?; if [ $COMPILE_STATUS -ne 0 ]; then cat /workspace/compile.err 1>&2; exit 2; fi; if [ -f /submission/${inputBase} ]; then timeout 15s java -cp /workspace ${jobId} < /submission/${inputBase} 1>/workspace/run.out 2>/workspace/run.err; else timeout 15s java -cp /workspace ${jobId} 1>/workspace/run.out 2>/workspace/run.err; fi; RUN_STATUS=$?; cat /workspace/run.out; if [ -s /workspace/run.err ]; then cat /workspace/run.err 1>&2; fi; exit $RUN_STATUS`
  ];

  try {
    const result = await runInDocker({ image: RUNNER_IMAGE, hostSubmissionDir: runPath, containerCmdArgs: containerCmd, timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS || DEFAULTS.timeoutMs, 10) });

    // schedule cleanup of original files
    setTimeout(() => { try { fs.unlinkSync(filePath); } catch (e) {} }, 20000);
    setTimeout(() => { try { if (inputFilePath) fs.unlinkSync(inputFilePath); } catch (e) {} }, 20000);
    // cleanup run dir
    try { fs.rmSync(runPath, { recursive: true, force: true }); } catch (e) {}

    if (result.error && result.exitCode === null) {
      throw new Error(`Docker failure: ${result.error.message || result.error}`);
    }

    const execTime = result.execTime;
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';

    if (result.exitCode === 2) {
      return Promise.reject({ error: stderr || 'Compilation failed', stderr });
    }

    if (result.exitCode !== 0) {
      return Promise.reject({ error: stderr || result.error || 'Execution failed', stderr });
    }

    return { stdout, stderr, execTime };
  } catch (err) {
    try { fs.rmSync(runPath, { recursive: true, force: true }); } catch (e) {}
    throw err;
  }
};

export default executeJava;
