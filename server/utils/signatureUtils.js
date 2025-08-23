export function enforceCppSignature(userCode, requiredSignature, requiredName) {
  const functionRegex = /(\w+(?:<[^>]+>)?[\s\*&]+\w+)\s*\([^)]*\)\s*\{/;
  const match = userCode.match(functionRegex);
  if (match) {
    return userCode.replace(functionRegex, `${requiredSignature} {`);
  }
  return userCode;
}

export function enforceJavaSignature(userCode, requiredSignature, requiredName) {
  let modifiedCode = userCode;
  modifiedCode = modifiedCode.replace(/public\s+class\s+[A-Za-z0-9_]+/, 'public class Solution');
  modifiedCode = modifiedCode.replace(/class\s+[A-Za-z0-9_]+/, 'class Solution');
  const methodRegex = /public\s+\w+(?:<[^>]+>)?\s+\w+\s*\([^)]*\)\s*\{/;
  const match = modifiedCode.match(methodRegex);
  if (match) {
    return modifiedCode.replace(methodRegex, `${requiredSignature} {`);
  }
  return modifiedCode;
}

export function enforceCSignature(userCode, requiredSignature, requiredName) {
  const functionRegex = /\w+\s+\w+\s*\([^)]*\)\s*\{/;
  const match = userCode.match(functionRegex);
  if (match) {
    return userCode.replace(functionRegex, `${requiredSignature} {`);
  }
  return userCode;
} 