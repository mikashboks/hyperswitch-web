// Real intentCall + React status component, synthetic HTTP only. Run after rescript.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const webpack=require('webpack');
const {chromium}=require('../../hyperswitch-control-center/node_modules/playwright');
const repo=path.resolve(__dirname,'..'),origin='https://customer-review.fixture';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'customer-review-ui-'));
let browser,passed=0;
const valid=()=>({id:'pay_a',profile_id:'profile_a',status:'review',customer_review:{schema_version:1,state:'under_review',as_of:'2026-11-18T00:00:00Z',message:'Your payment is being checked. Check this payment before paying again.',actions:['check_existing_payment','contact_support']}});
async function main(){
  const values={repoName:'fixture',repoVersion:'fixture',publicPath:'',backendEndPoint:origin,confirmEndPoint:origin,sdkUrl:origin,logEndpoint:origin+'/logs',sentryDSN:'',sentryScriptUrl:undefined,enableLogging:false,loggingLevel:'SILENT',maxLogsPushedPerEventName:0,sdkVersionValue:'v2',isIntegrationEnv:false,isSandboxEnv:true,isProductionEnv:false,isLocal:true};
  await new Promise((resolve,reject)=>{const compiler=webpack({mode:'development',context:repo,devtool:false,entry:path.join(__dirname,'customer-review-browser.js'),output:{path:output,filename:'fixture.js'},resolve:{alias:{'/package.json':path.join(repo,'package.json')}},plugins:[new webpack.DefinePlugin(Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v===undefined?'undefined':JSON.stringify(v)])))]});compiler.run((error,stats)=>compiler.close(()=>error||stats.hasErrors()?reject(error||Error(stats.toString({all:false,errors:true}))):resolve()));});
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
  const page=await browser.newPage();const requests=[],errors=[];
  const dateTimeSession=await page.context().newCDPSession(page);await dateTimeSession.send('Emulation.setTimezoneOverride',{timezoneId:'Africa/Freetown'});
  let body=valid(),httpStatus=200,delay=0;
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(output,'fixture.js'))});
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><div id="app"></div><script src="/fixture.js"></script>'});
    requests.push({url:req.url(),method:req.method(),headers:req.headers(),body:req.postData()});
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    return route.fulfill({status:httpStatus,contentType:'application/json',body:JSON.stringify(body)}).catch(()=>{});
  });
  await page.goto(origin);await page.waitForFunction(()=>window.fixtureReady);
  async function test(name,fn){requests.length=0;body=valid();httpStatus=200;delay=0;await fn();passed++;console.log('PASS '+name);}
  await test('actual confirm 412 renders accessible review and only client GET',async()=>{await page.evaluate(()=>window.runConfirm());await page.getByRole('heading',{name:'Payment review'}).waitFor();assert.equal(await page.locator('[role=status]').getAttribute('aria-live'),'polite');assert.equal(await page.getByRole('button',{name:'Check payment status'}).count(),1);assert.equal(requests.length,1);assert.equal(requests[0].method,'GET');assert.equal(requests[0].headers.authorization,'publishable-key=pk_snd_fixture,client-secret=cs_fixture');assert.equal(requests[0].headers['api-key'],undefined);assert.equal(requests[0].body,null);});
  for(const tenantId of ['public','tenant_other',''])await test('tenant transport '+(tenantId||'omitted')+' is preserved',async()=>{await page.evaluate(tenantId=>window.runConfirm({tenantId}),tenantId);assert.equal(requests.length,1);assert.equal(requests[0].headers['x-tenant-id'],tenantId||undefined);});
  await test('older same-context async result cannot replace a newer read',async()=>{assert.equal(await page.evaluate(async()=>{const r=window.customerReview,ctx=window.fixtureContext,old=window.fetch;let n=0;window.fetch=async()=>{const call=++n;if(call===1)await new Promise(resolve=>setTimeout(resolve,150));return new Response(JSON.stringify({id:'pay_a',profile_id:'profile_a',status:call===1?'failed':'processing'}));};try{const first=r.read(ctx),second=r.read(ctx);const newer=await second,older=await first;return newer.status==='processing'&&older===undefined;}finally{window.fetch=old;}}),true);});
  for(const [name,change] of [['no review',v=>{delete v.customer_review;}],['unknown version',v=>v.customer_review.schema_version=2],['unknown state',v=>v.customer_review.state='allow'],['wrong payment',v=>v.id='other'],['wrong profile',v=>v.profile_id='other'],['invalid timestamp',v=>v.customer_review.as_of='tomorrow']])await test(name+' keeps existing error presentation',async()=>{change(body);const result=await page.evaluate(()=>window.runConfirm());assert.equal(result.error.type,'original_error');assert.equal(await page.locator('#original-error').textContent(),'Original presentation');assert.equal(await page.getByRole('status').count(),0);});
  for(const status of [401,403,500])await test('read '+status+' keeps existing error',async()=>{httpStatus=status;const result=await page.evaluate(()=>window.runConfirm());assert.equal(result.error.type,'original_error');assert.equal(await page.getByRole('status').count(),0);});
  await test('slow read is bounded and falls back without navigation',async()=>{delay=1500;const start=Date.now();const result=await page.evaluate(()=>window.runConfirm());assert.equal(result.error.type,'original_error');assert.ok(Date.now()-start<1300);assert.equal(page.url(),origin+'/');});
  await test('non-412 avoids added read',async()=>{await page.evaluate(()=>window.runConfirm({status:400}));assert.equal(requests.length,0);assert.equal(await page.locator('#original-error').textContent(),'Original presentation');});
  await test('other callers and mismatched resource avoid added read',async()=>{await page.evaluate(()=>window.runConfirm({withContext:false}));await page.evaluate(()=>window.runConfirm({paymentId:'other'}));assert.equal(requests.length,0);});
  await test('refresh is read-only and replaces expired review',async()=>{await page.evaluate(()=>window.runConfirm());body.customer_review={...body.customer_review,state:'approval_expired',message:'Your payment needs another check. Check this payment before paying again.'};await page.getByRole('button',{name:'Check payment status'}).click();await page.getByText(body.customer_review.message).waitFor();assert.equal(requests.length,2);assert.ok(requests.every(r=>r.method==='GET'));});
  await test('failed refresh preserves last confirmed view and warns',async()=>{await page.evaluate(()=>window.runConfirm());httpStatus=500;await page.getByRole('button',{name:'Check payment status'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('heading',{name:'Payment review'}).count(),1);assert.ok((await page.getByRole('alert').textContent()).includes('last confirmed'));});
  await test('fresh processing clears review presentation without exposing pay control',async()=>{await page.evaluate(()=>window.runConfirm());body={id:'pay_a',profile_id:'profile_a',status:'processing'};await page.getByRole('button',{name:'Check payment status'}).click();await page.getByRole('heading',{name:'Payment status updated'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Payment review'}).count(),0);assert.ok((await page.getByRole('status').textContent()).includes('being processed'));assert.equal(await page.getByRole('button').count(),1);});
  for (const status of ['succeeded','failed','cancelled','cancelled_post_capture','processing','requires_customer_action','requires_merchant_action','requires_payment_method','requires_confirmation','requires_capture','partially_captured','partially_captured_and_capturable','partially_authorized_and_requires_capture','partially_captured_and_processing','conflicted','expired']) await test('fresh '+status+' has plain guidance and a checked time',async()=>{
    await page.evaluate(()=>window.runConfirm());body={id:'pay_a',profile_id:'profile_a',status};await page.getByRole('button',{name:'Check payment status'}).click();await page.getByRole('heading',{name:'Payment status updated'}).waitFor();
    const text=await page.getByRole('status').textContent();assert.ok(!text.includes('_'));assert.ok(text.includes('before paying again'));assert.equal(await page.locator('time').count(),1);assert.ok(Number.isFinite(Date.parse(await page.locator('time').getAttribute('datetime'))));assert.equal(await page.getByRole('button').count(),1);
  });
  await test('different context snapshots do not overwrite each other',async()=>{assert.equal(await page.evaluate(()=>{const r=window.customerReview;const a=r.key('host','pk_a','','','a','p'),b=r.key('host','pk_a','','','b','p'),c=r.key('host','pk_other','','','a','p');let x=r.remember({}, {scopeKey:a,paymentId:'a',profileId:'p',status:'review'});x=r.remember(x,{scopeKey:b,paymentId:'b',profileId:'p',status:'review'});x=r.remember(x,{scopeKey:c,paymentId:'a',profileId:'p',status:'processing'});return r.lookup(x,a).status==='review'&&r.lookup(x,b).paymentId==='b'&&r.lookup(x,c).status==='processing';}),true);});
  await test('old real submit callback consults current review state before any payload or dispatch',async()=>{await page.evaluate(()=>window.pinScopedReview());await page.waitForFunction(()=>window.probeRendered);const reply=await page.evaluate(()=>new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(Error('host submit did not receive a response')),500);const receive=event=>{if(event.data?.submitSuccessful===false){clearTimeout(deadline);window.removeEventListener('message',receive);resolve(event.data);}};window.addEventListener('message',receive);window.staleSubmit(undefined,undefined,undefined);}));assert.equal(reply.error.type,"payment_under_review");assert.equal(requests.length,0);});
  await test('repeat submit after review changed to processing also replies without sending',async()=>{await page.evaluate(()=>window.pinScopedProcessing());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const reply=await page.evaluate(()=>new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(Error('host submit did not receive a response')),500);const receive=event=>{if(event.data?.submitSuccessful===false){clearTimeout(deadline);window.removeEventListener('message',receive);resolve(event.data);}};window.addEventListener('message',receive);window.staleSubmit(undefined,undefined,undefined);}));assert.equal(reply.error.type,'payment_status_requires_check');assert.ok(!reply.error.message.includes('held'));assert.equal(requests.length,0);});
  await test('new embedded binding accepts only its actual parent source',async()=>{assert.deepEqual(await page.evaluate(()=>[window.acceptsCustomerBindingMessage({source:window.parent}),window.acceptsCustomerBindingMessage({source:{}}),window.acceptsCustomerBindingMessage({source:null})]),[true,false,false]);});
  await test('Hyper A then B then A keeps capabilities and iframe URL on original backend, including singleton reuse',async()=>{
    const result=await page.evaluate(async()=>{
      const make=window.makeHyper,options=customBackendUrl=>({customBackendUrl,isForceInit:true,isPreloadEnabled:false});
      const a=make({publishableKey:'pk_snd_a',profileId:'profile_a',tenantId:'public'},options(location.origin+'/backend-a'));
      a.elements({paymentId:'pay_a',clientSecret:'cs_a'});
      const b=make({publishableKey:'pk_snd_b',profileId:'profile_a',tenantId:'tenant_b'},options(location.origin+'/backend-b'));
      b.elements({paymentId:'pay_a',clientSecret:'cs_b'});
      await a.retrievePaymentIntent('cs_a');
      const singleton=make({publishableKey:'pk_snd_c',profileId:'profile_a'},{customBackendUrl:location.origin+'/backend-c',isPreloadEnabled:false});
      await singleton.retrievePaymentIntent('cs_b');
      document.querySelectorAll('[id^="orca-element-hyper-preMountLoader"]').forEach(node=>node.remove());
      a.elements({paymentId:'pay_a',clientSecret:'cs_a'});
      await a.retrievePaymentIntent('cs_a');
      const iframe=document.querySelector('iframe[src*="fullscreenType=preMountLoader"]');
      return {same:singleton===b,endpoint:iframe?new URL(iframe.src).searchParams.get('endpoint'):null};
    });
    const reads=requests.filter(r=>r.url.endsWith('/get-intent'));
    assert.equal(reads.length,3);assert.equal(result.same,true);assert.equal(result.endpoint,origin+'/backend-a');
    assert.deepEqual(reads.map(r=>new URL(r.url).pathname.split('/')[1]),['backend-a','backend-b','backend-a']);
    assert.deepEqual(reads.map(r=>r.headers.authorization),['publishable-key=pk_snd_a,client-secret=cs_a','publishable-key=pk_snd_b,client-secret=cs_b','publishable-key=pk_snd_a,client-secret=cs_a']);
    assert.deepEqual(reads.map(r=>r.headers['x-tenant-id']),['public','tenant_b','public']);
  });
  await test('read time uses SDK locale and local time zone while preserving semantic ISO',async()=>{
    await page.evaluate(()=>window.setCustomerLocale('en-GB'));await page.evaluate(()=>window.runConfirm());
    const expected=await page.evaluate(()=>new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date('2026-11-18T00:00:00Z')));
    await page.waitForFunction(expected=>document.querySelector('time')?.textContent===expected,expected);
    assert.equal(await page.locator('time').getAttribute('datetime'),'2026-11-18T00:00:00Z');
    assert.ok(expected.includes('GMT'));assert.ok(!expected.includes('T00:00:00Z'));
  });
  await test('local time conversion follows another zone and the configured locale',async()=>{
    await dateTimeSession.send('Emulation.setTimezoneOverride',{timezoneId:'America/New_York'});
    await page.evaluate(()=>window.setCustomerLocale('fr-FR'));await page.evaluate(()=>window.runConfirm());
    const expected=await page.evaluate(()=>new Intl.DateTimeFormat('fr-FR',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date('2026-11-18T00:00:00Z')));
    await page.waitForFunction(expected=>document.querySelector('time')?.textContent===expected,expected);
    assert.ok(expected.includes('17'));assert.ok(expected.includes('19:00'));assert.ok(expected.includes('UTC'));
    assert.equal(await page.locator('time').getAttribute('datetime'),'2026-11-18T00:00:00Z');
    await dateTimeSession.send('Emulation.setTimezoneOverride',{timezoneId:'Africa/Freetown'});await page.evaluate(()=>window.setCustomerLocale('en-GB'));
  });
  if(process.env.CUSTOMER_REVIEW_EVIDENCE_DIR){body=valid();await page.evaluate(()=>window.runConfirm());await page.getByRole('heading',{name:'Payment review'}).waitFor();await page.setViewportSize({width:390,height:600});await page.screenshot({path:path.join(process.env.CUSTOMER_REVIEW_EVIDENCE_DIR,'customer-review-mobile.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,kind:'real intentCall and rendered status component; synthetic browser HTTP',live:false}));
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();fs.rmSync(output,{recursive:true});console.log('Owned browser bundle removed: '+output);});
