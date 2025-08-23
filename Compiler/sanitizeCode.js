const sanitizeCode = (language, code) => {
    code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
    switch (language) {
      case 'cpp':
      case 'c':
        code = code.replace(/(#include\s*<[^>]+>)(?!\s*\n)/g, "$1\n");
        code = code.replace(/(;)(\s*int\s+main\s*\()/g, "$1\n$2");
        break;
  
      case 'java':
        code = code.replace(/(;)(\s*public\s+static\s+void\s+main\s*\()/g, "$1\n$2");
        code = code.replace(/(;)(\s*class\s+[a-zA-Z_][a-zA-Z0-9_]*)/g, "$1\n$2");
        break;
  
      default:
        break;
    }
  
    return code;
  };
  
  export default sanitizeCode;
  