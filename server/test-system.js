import mongoose from 'mongoose';
import Problem from './models/Problem.js';
import { enforceCppSignature, enforceJavaSignature, enforceCSignature } from './utils/signatureUtils.js';
import { wrapCppCode, wrapJavaCode, wrapCCode } from './utils/codeWrappers.js';
import { addJavaImports } from './utils/compilerUtils.js';

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_judge';

async function testSystem() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    
    // Test 1: Check if problems exist
    const problems = await Problem.find({});
    
    if (problems.length === 0) {
      return;
    }
    
    // Test 2: Check first problem's structure
    const firstProblem = problems[0];
    
    // Test 3: Test signature enforcement
    
    const testCppCode = `vector<int> myFunction(vector<int>& nums, int target) {
    return {};
}`;
    const enforcedCpp = enforceCppSignature(testCppCode, firstProblem.functionSignature?.get('cpp'), firstProblem.functionName);
    
    const testJavaCode = `public class MyClass {
    public int[] myMethod(int[] nums, int target) {
        return new int[0];
    }
}`;
    const enforcedJava = enforceJavaSignature(testJavaCode, firstProblem.functionSignature?.get('java'), firstProblem.functionName);
    
    const testCCode = `int* myFunction(int* nums, int numsSize, int target, int* returnSize) {
    return NULL;
}`;
    const enforcedC = enforceCSignature(testCCode, firstProblem.functionSignature?.get('c'), firstProblem.functionName);
    
    // Test 4: Test code wrapping
    
    const testInput = firstProblem.publicTestCases[0]?.input || 'nums=[2,7,11,15], target=9';
    
    const wrappedCpp = wrapCppCode(enforcedCpp, testInput, firstProblem.functionName, firstProblem.functionSignature?.get('cpp'));
    
    const wrappedJava = wrapJavaCode(enforcedJava, testInput, firstProblem.functionName, firstProblem.functionSignature?.get('java'));
    
    const wrappedC = wrapCCode(enforcedC, testInput, firstProblem.functionName, firstProblem.functionSignature?.get('c'));
    
    // Test 5: Test Java imports
    const javaWithImports = addJavaImports(enforcedJava);
    
  } catch (error) {
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testSystem(); 