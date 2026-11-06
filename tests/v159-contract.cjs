const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const base='9069869493959fdee618dd02fbf61e807b7cbd1b';
const a=cp.execFileSync('git',['show',base+':app.js'],{encoding:'utf8',maxBuffer:4e6}),b=fs.readFileSync('app.js','utf8');
function block(s,start,end){const i=s.indexOf(start);assert(i>=0,start);const j=s.indexOf(end,i+start.length);assert(j>i,end);return s.slice(i,j);}
function protectedSource(s){return s.replace("      if(exchange && ((exchangeUi&&!exchangeUi.current()) || (overtime().length&&acceptedTime!==timeKey())))throw new Error('조건 또는 운동 구성이 바뀌었어요. 시간 초과 여부를 다시 확인해주세요.');\n",'').replace('if(exchangeUi)exchangeUi.finish();','').replace('validateBaseCandidate(chosen,!!exchange)','validateBaseCandidate(chosen)').replace('return validateBaseCandidate(candidate,true);','return validateBaseCandidate(candidate);');}
for(const [start,end] of [
 ['  function baseExchangeFingerprint(', '  function baseExchangeChanges('],
 ['// SESSION_TIMING_START','// SESSION_TIMING_END'],
 ["dialog.querySelector('[data-generate]').onclick=async function(){", '  function openProposalHistory('],
 ["dialog.querySelector('[data-yes]').onclick=function(){try{\n      if(exchange",'  function openBasePlanSurvey('],
 ['      var prompt=','      var output=section.querySelector'],
 ['  function baseAllocationHtml(', '// Pure, shared factual accounting.'],
]){assert.equal(protectedSource(block(b,start,end)),protectedSource(block(a,start,end)),start);console.log('PASS protected block (explicit overtime/UI exceptions normalized): '+start);}
for(const f of ['manifest.webmanifest','.github/workflows/integration.yml']){if(fs.existsSync(f))assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8'}));}
console.log('PASS Worker request handler, non-time exchange validation, prompt contract, apply transaction, timing and volume preserved. No actual Worker/ChatGPT call.');
