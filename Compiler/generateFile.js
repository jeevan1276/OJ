import path from 'path';
import fs from 'fs';
import {v4 as uuid} from 'uuid';
    const __dirname = path.resolve();
const dirCodes = path.join(__dirname,"user_codes");
if(!fs.existsSync(dirCodes)){
    fs.mkdirSync(dirCodes, {recursive: true});
}
const generateFile = (language, code) => {
    let fileName;
    let filePath;
    
    if (language === 'java') {
        const uniqueDir = path.join(dirCodes, `java_${uuid()}`);
        if (!fs.existsSync(uniqueDir)) {
            fs.mkdirSync(uniqueDir, { recursive: true });
        }
        fileName = `Solution.java`;
        filePath = path.join(uniqueDir, fileName);
    } else {
        fileName = `${uuid()}.${language}`;
        filePath = path.join(dirCodes, fileName);
    }
    
    fs.writeFileSync(filePath, code);
    return filePath;
}

function generateInputFile(input) {
    const inputDir = path.join(__dirname, "inputs");
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
    }
    const fileName = `${uuid()}.txt`;
    const filePath = path.join(inputDir, fileName);
    fs.writeFileSync(filePath, input);
    return filePath;
}

export { generateFile, generateInputFile };