// Test-only classification: retain blocked requests, never hide unknown failures.
const fs=require('node:fs');
module.exports=function networkEvidence(page,file){
  const rows=[];
  const save=row=>{rows.push(row);fs.appendFileSync(file,JSON.stringify(row)+'\n');};
  page.on('requestfailed',request=>save({event:'requestfailed',url:request.url(),type:request.resourceType(),failure:request.failure()?.errorText,classification:new URL(request.url()).hostname==='127.0.0.1'?'UNEXPECTED_LOCAL_FAILURE':'EXTERNAL_BLOCKED_BY_TEST_ROUTE'}));
  page.on('response',response=>{if(response.status()>=400)save({event:'http-error',url:response.url(),status:response.status(),classification:'UNEXPECTED_HTTP_FAILURE'});});
  page.on('console',message=>{if(/Service Worker registration blocked by Playwright/.test(message.text()))save({event:'console',classification:'SW_BLOCKED_BY_TEST_CONTEXT',message:message.text()});});
  return ()=>{const unexpected=rows.filter(r=>r.classification.startsWith('UNEXPECTED'));if(unexpected.length)throw Error(JSON.stringify(unexpected));console.log('NETWORK EVIDENCE '+file+' '+JSON.stringify(rows));};
};
