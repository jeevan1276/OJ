import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const __dirname = path.resolve();
const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeC = (filePath, inputFilePath = null) => {
  const jobId = path.basename(filePath).split(".")[0];
  const outputFileName = `${jobId}.out`;
  const outPath = path.join(outputPath, outputFileName);

  return new Promise((resolve, reject) => {
    exec(`gcc -Werror=return-type  "${filePath}" -o "${outPath}"`, (compileErr, compileStdout, compileStderr) => {
      if (compileErr) {
        setTimeout(() => { try { fs.unlinkSync(filePath); } catch (e) {
        } }, 20000);
        return reject({ error: compileStderr, stderr: compileStderr });
      }   
      let runCmd = `"${outPath}"`;
      if (inputFilePath) {
        runCmd = `"${outPath}" < "${inputFilePath}"`;
      }
      const startTime = Date.now();
      exec(runCmd, (runErr, runStdout, runStderr) => {
        const execTime = Date.now() - startTime;
        setTimeout(() => { try { fs.unlinkSync(filePath); } catch (e) {
        } }, 20000);
        setTimeout(() => { try { fs.unlinkSync(outPath); } catch (e) {
        } }, 20000);
        if (runErr) {
          return reject({ error: runStderr, stderr: runStderr });
        }
        resolve({ stdout: runStdout, stderr: runStderr, execTime });
      });
    });
  });
};

export default executeC;
