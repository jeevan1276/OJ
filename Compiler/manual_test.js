const API = process.env.COMPILER_URL || 'http://localhost:8000/compile';

const tests = [
  { name: 'hello-c', language: 'c', code: '#include <stdio.h>\nint main(){printf("hello\n");return 0;}' },
  { name: 'infinite-loop-c', language: 'c', code: '#include <stdio.h>\nint main(){while(1){} return 0;}' },
  { name: 'infinite-loop-cpp', language: 'cpp', code: '#include <iostream>\nint main(){for(;;){} return 0; }' },
  { name: 'fork-bomb-c', language: 'c', code: '#include <unistd.h>\nint main(){ while(1) fork(); return 0; }' },
  { name: 'read-file', language: 'c', code: '#include <stdio.h>\nint main(){ FILE *f = fopen("/etc/passwd","r"); if(!f){printf("no access\n"); return 1;} printf("got\n"); return 0; }' },
  { name: 'network', language: 'c', code: '#include <sys/socket.h>\n#include <arpa/inet.h>\n#include <unistd.h>\nint main(){int s=socket(AF_INET,SOCK_STREAM,0); if(s<0){return 1;} return 0; }' }
];

async function run(test){
  console.log('Running', test.name);
  const res = await fetch(API, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ language: test.language, code: test.code }) });
  const json = await res.json();
  console.log(test.name, '=>', json);
}

async function main(){
  for (const t of tests) {
    try { await run(t); } catch (e) { console.error('error', e); }
  }
}

main();
