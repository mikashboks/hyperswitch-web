// Run after `rescript`. Bundles the real read adaptor; all fetches are local mocks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const webpack = require('webpack');

const repo = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'customer-intent-read-'));
const originalFetch = global.fetch;
let passed = 0;
async function main() {
  const compiler = webpack({
    mode: 'development', target: 'node', devtool: false,
    entry: path.join(repo, 'src/Utilities/APIHelpers/CustomerIntentRead.bs.js'),
    output: {path: output, filename: 'read.cjs', library: {type: 'commonjs2'}},
  });
  await new Promise((resolve, reject) => compiler.run((error, stats) => {
    compiler.close(closeError => {
      if (error || closeError || stats.hasErrors()) reject(error || closeError || new Error(stats.toString()));
      else resolve();
    });
  }));
  const {retrieve} = require(path.join(output, 'read.cjs'));
  const base = ['https://customer.invalid', 'pk_snd_fixture', 'profile_a', 'tenant_a', 'pay_a', 'cs_fixture', 'cs_fixture'];
  const review = {schema_version: 1, state: 'under_review', as_of: '2026-11-18T00:00:00Z',
    message: "Check this payment's status before paying again.", actions: ['check_existing_payment','contact_support']};
  const response = {id:'pay_a', profile_id:'profile_a', status:'review', customer_review:review};
  let calls = [];
  function mock(body=response, status=200) {
    global.fetch = async (url, options) => {calls.push({url, options}); return new Response(JSON.stringify(body),{status});};
  }
  async function test(name, callback) {calls=[];mock(); await callback();passed++;console.log('PASS '+name);}
  await test('normal client capability read retains typed review without changing status', async () => {
    assert.deepEqual(await retrieve(...base),{paymentIntent:response});
    assert.equal(calls.length,1);assert.equal(calls[0].url,'https://customer.invalid/v2/payments/pay_a/get-intent');
    const {options}=calls[0];assert.equal(options.method,'GET');assert.equal(options.cache,'no-store');assert.equal(options.body,undefined);
    assert.equal(options.headers.get('authorization'),'publishable-key=pk_snd_fixture,client-secret=cs_fixture');
    assert.equal(options.headers.get('x-profile-id'),'profile_a');assert.equal(options.headers.get('x-tenant-id'),'tenant_a');
    assert.equal(options.headers.has('api-key'),false);assert.equal(calls[0].url.includes('cs_fixture'),false);
  });
  for (const [name,index,value] of [['different client secret',6,'other'],['missing payment',4,''],['missing profile',2,''],['missing secret',6,''],['server key',1,'sk_private']]) {
    await test(name+' makes no HTTP request',async()=>{let args=[...base];args[index]=value;assert.equal(await retrieve(...args),null);assert.equal(calls.length,0);});
  }
  await test('tenant is never invented',async()=>{let args=[...base];args[3]='';await retrieve(...args);assert.equal(calls[0].options.headers.has('x-tenant-id'),false);});
  await test('invalid header preserves uncertainty without request',async()=>{let args=[...base];args[2]='profile\ninvalid';assert.equal(await retrieve(...args),null);assert.equal(calls.length,0);});
  for (const status of [401,403,404,500]) await test(status+' preserves uncertainty',async()=>{mock({error:'fixture'},status);assert.equal(await retrieve(...base),null);assert.equal(calls.length,1);});
  await test('network uncertainty never retries',async()=>{global.fetch=async()=>{calls.push({});throw Error('offline');};assert.equal(await retrieve(...base),null);assert.equal(calls.length,1);});
  await test('different resource rejected',async()=>{mock({...response,id:'pay_other'});assert.equal(await retrieve(...base),null);});
  await test('different profile rejected',async()=>{mock({...response,profile_id:'other'});assert.equal(await retrieve(...base),null);});
  await test('generic review without projection stays generic',async()=>{const value={id:'pay_a',profile_id:'profile_a',status:'review'};mock(value);assert.deepEqual(await retrieve(...base),{paymentIntent:value});});
  await test('ordinary processing response is unchanged',async()=>{const value={id:'pay_a',profile_id:'profile_a',status:'processing'};mock(value);assert.deepEqual(await retrieve(...base),{paymentIntent:value});});
  await test('unknown state stays server data and cannot trigger action',async()=>{const value={...response,customer_review:{state:'future_state'}};mock(value);assert.deepEqual(await retrieve(...base),{paymentIntent:value});assert.equal(calls.length,1);});
  await test('payment path encoded',async()=>{let args=[...base];args[4]='pay/a?x';mock({...response,id:args[4]});await retrieve(...args);assert.equal(calls[0].url,'https://customer.invalid/v2/payments/pay%2Fa%3Fx/get-intent');});
  const hyper=fs.readFileSync(path.join(repo,'src/hyper-loader/Hyper.res'),'utf8');
  assert.match(hyper,/GlobalVars\.sdkVersion == V2[\s\S]*?CustomerIntentRead\.retrieve/);
  assert.match(hyper,/~initializedClientSecret=clientSecret\.contents/);
  assert.match(hyper,/~paymentId=paymentId\.contents/);
  console.log(JSON.stringify({passed,kind:'actual compiled adaptor HTTP mocks; Hyper wiring source-checked',live:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  global.fetch=originalFetch;fs.rmSync(output,{recursive:true});console.log('Owned test bundle removed: '+output);
});
