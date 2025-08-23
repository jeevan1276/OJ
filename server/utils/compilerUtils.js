export function cleanCompilerError(stderr, language, originalUserCode = '') {
  if (!stderr) return { message: '', lines: [] };
  let USER_CODE_LINE_OFFSET = 3;
  let regex;
  if (language === 'java') {
    regex = /(?:.*[\\/])?([A-Za-z0-9_]+)\.java:(\d+):\s*(error|warning):\s*(.*)/;
    let offset = 0;
    if (originalUserCode.includes('public class ')) {
      offset = 0;
    } else {
      offset = 2;
    }
    if (originalUserCode.includes('HashMap') || 
        originalUserCode.includes('Map<') ||
        originalUserCode.includes('ArrayList') || 
        originalUserCode.includes('List<') ||
        originalUserCode.includes('Arrays.') ||
        originalUserCode.includes('Collections.') ||
        originalUserCode.includes('PriorityQueue') ||
        originalUserCode.includes('HashSet') || 
        originalUserCode.includes('Set<') ||
        originalUserCode.includes('LinkedList') ||
        originalUserCode.includes('Queue<') ||
        originalUserCode.includes('Stack')) {
      const hasUtilImport = originalUserCode.includes('import java.util.*;') || 
                           originalUserCode.includes('import java.util.*');
      if (!hasUtilImport) {
        offset += 1;
      }
    }
    USER_CODE_LINE_OFFSET = offset;
  } else {
    regex = /(?:.*[\\/])?([A-Za-z0-9_\.]+):(\d+):(?:\d+:)?\s*(error|warning):\s*(.*)/;
  }
  const lines = stderr.split('\n');
  let formatted = [];
  let errorLines = [];
  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      let userLine = Math.max(1, parseInt(match[2], 10) - USER_CODE_LINE_OFFSET);
      let message = language === 'java'
        ? match[4].trim()
        : match[4].replace(/\s*\[[^\]]*\]$/, '').trim();
      formatted.push(`Line ${userLine}: error: ${message}`);
      errorLines.push(userLine);
    }
  }
  return {
    message: formatted.length ? formatted.join('\n') : stderr.trim(),
    lines: errorLines
  };
}

export function addJavaImports(userCode) {
  const usesCollections = userCode.includes('HashMap') || 
                         userCode.includes('Map<') ||
                         userCode.includes('ArrayList') || 
                         userCode.includes('List<') ||
                         userCode.includes('Arrays.') ||
                         userCode.includes('Collections.') ||
                         userCode.includes('PriorityQueue') ||
                         userCode.includes('HashSet') || 
                         userCode.includes('Set<') ||
                         userCode.includes('LinkedList') ||
                         userCode.includes('Queue<') ||
                         userCode.includes('Stack');
  const hasUtilImport = userCode.includes('import java.util.*;') || 
                       userCode.includes('import java.util.*');
  if (usesCollections && !hasUtilImport) {
    return 'import java.util.*;\n' + userCode;
  }
  return userCode;
} 