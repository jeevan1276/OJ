import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const __dirname = path.resolve();
const outputPath = path.join(__dirname, "outputs");
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

const executeJava = (filePath, inputFilePath = null) => {
    const jobId = path.basename(filePath, '.java');
    const dir = path.dirname(filePath);
    const classFile = path.join(dir, `${jobId}.class`);

    return new Promise((resolve, reject) => {
        const compileProcess = exec(`javac "${filePath}"`, { timeout: 10000 }, (compileErr, compileStdout, compileStderr) => {
            if (compileErr) {
                setTimeout(() => { 
                    try { 
                        if (dir.includes('java_')) {
                            if (fs.existsSync(dir)) {
                                fs.rmSync(dir, { recursive: true, force: true });
                            }
                        } else {
                            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                        }
                    } catch (e) {
                    } 
                }, 20000);
                
                let errorMessage = compileStderr;
                if (compileStderr.includes('class not found') || compileStderr.includes('cannot find symbol')) {
                    errorMessage = 'Class not found error: Please ensure your class name matches the file name and all required classes are properly defined.';
                } else if (compileStderr.includes('missing return statement')) {
                    errorMessage = 'Missing return statement: Please ensure your method returns the expected value.';
                } else if (compileStderr.includes('illegal start of expression')) {
                    errorMessage = 'Syntax error: Please check your code syntax and method structure.';
                } else if (compileErr.code === 'ETIMEDOUT') {
                    errorMessage = 'Compilation timeout: The compilation took too long. Please check your code for infinite loops or complex operations.';
                }
                
                return reject({ error: errorMessage, stderr: compileStderr });
            }
            
            let runCmd = `java -cp "${dir}" ${jobId}`;
            if (inputFilePath) {
                runCmd = `java -cp "${dir}" ${jobId} < "${inputFilePath}"`;
            }
            const startTime = Date.now();
            
            const runProcess = exec(runCmd, { timeout: 15000 }, (runErr, runStdout, runStderr) => {
                const execTime = Date.now() - startTime;
                setTimeout(() => { 
                    try { 
                        if (dir.includes('java_')) {
                            if (fs.existsSync(dir)) {
                                fs.rmSync(dir, { recursive: true, force: true });
                            }
                        } else {
                            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                        }
                    } catch (e) {
                    } 
                }, 20000);
                setTimeout(() => { 
                    try { 
                        if (fs.existsSync(classFile)) fs.unlinkSync(classFile); 
                    } catch (e) {
                    } 
                }, 20000);
                if (runErr) {
                    
                    let errorMessage = runStderr;
                    if (runStderr.includes('NoClassDefFoundError') || runStderr.includes('ClassNotFoundException')) {
                        errorMessage = 'Class not found at runtime: The compiled class could not be found. This may be due to a class name mismatch.';
                    } else if (runStderr.includes('NoSuchMethodError')) {
                        errorMessage = 'Method not found: The main method or required method could not be found.';
                    } else if (runStderr.includes('Exception in thread "main"')) {
                        errorMessage = 'Runtime exception: ' + runStderr.split('Exception in thread "main"')[1]?.trim() || runStderr;
                    } else if (runErr.code === 'ETIMEDOUT') {
                        errorMessage = 'Execution timeout: The program took too long to execute. Please check for infinite loops or inefficient algorithms.';
                    }
                    
                    return reject({ error: errorMessage, stderr: runStderr });
                }
                resolve({ stdout: runStdout, stderr: runStderr, execTime });
            });
        });
    });
};

export default executeJava;
