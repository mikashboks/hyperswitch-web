import * as React from 'react';
import {createRoot} from 'react-dom/client';
import * as PaymentHelpers from '../src/Utilities/PaymentHelpers.bs.js';
import * as CustomerReview from '../src/Utilities/CustomerReview.bs.js';
import * as Utils from '../src/Utilities/Utils.bs.js';
import * as Hyper from '../src/hyper-loader/Hyper.bs.js';
import * as Status from '../src/Components/CustomerReviewStatus.bs.js';
import * as Payment from '../src/Payment.bs.js';
import * as LoggerUtils from '../src/Utilities/LoggerUtils.bs.js';
import {Provider,createStore,useAtom,useSetAtom} from 'jotai';
import * as Atoms from '../src/Utilities/JotaiAtoms.bs.js';
import * as CommonHooks from '../src/Hooks/CommonHooks.bs.js';

const context={backendUrl:location.origin,publishableKey:'pk_snd_fixture',profileId:'profile_a',tenantId:'',paymentId:'pay_a',clientSecret:'cs_fixture',customPodUri:''};
function SubmitProbe(){
  const submit=PaymentHelpers.usePaymentIntent(undefined,'Card');
  const setConfig=useSetAtom(Atoms.configAtom);
  const [views,setViews]=useAtom(Atoms.customerReview);
  const key=CustomerReview.scope(context);
  React.useEffect(()=>{
    window.staleSubmit=submit;
    window.setCustomerLocale=locale=>setConfig(previous=>({...previous,localeString:{...previous.localeString,locale}}));
    window.pinScopedProcessing=()=>setViews(previous=>({...previous,[key]:{context,snapshot:{scopeKey:key,paymentId:'pay_a',profileId:'profile_a',status:'processing',checkedAt:new Date().toISOString()}}}));
    window.pinScopedReview=()=>setViews(previous=>({...previous,[key]:{context,snapshot:{scopeKey:key,paymentId:'pay_a',profileId:'profile_a',status:'review',checkedAt:'2026-11-18T00:00:00Z',review:{state:'under_review',message:'fixture',asOf:'2026-11-18T00:00:00Z'}}}}));
  },[]);
  React.useEffect(()=>{window.probeRendered=!!CustomerReview.lookup(views,key);});
  return null;
}
function PaymentMountProbe(){
  const [mode,setMode]=React.useState(null);
  React.useEffect(()=>{window.mountPaymentElement=nextMode=>setMode(nextMode);},[]);
  return mode ? React.createElement(Payment.make,{paymentMode:mode,integrateError:false,logger:LoggerUtils.defaultLoggerConfig}) : null;
}
function Fixture() {
  const [snapshot,setSnapshot]=React.useState();
  const [error,setError]=React.useState('');
  React.useEffect(()=>{
    window.runConfirm=async ({status=412,withContext=true,paymentId='pay_a',tenantId=''}={})=>{
      setError('');setSnapshot(undefined);
      const result=await PaymentHelpers.intentCall(
        async()=>new Response(JSON.stringify({error:{type:'original_error',message:'Original presentation'}}),{status}),
        `${location.origin}/v2/payments/${paymentId}/confirm-intent`,[], '{}',
        {return_url:location.origin+'/return',publishableKey:context.publishableKey},context.clientSecret,
        undefined,false,'Card','fixture','POST',()=>{},'',false,0,undefined,false,'payment',
        {shouldUseTopRedirection:false,shouldRemoveBeforeUnloadEvents:false},undefined,undefined,false,location.origin,
        withContext?{...context,tenantId}:undefined,value=>setSnapshot(value));
      setError(result?.error?.message || '');
      return result;
    };
    window.fixtureReady=true;
  },[]);
  const check=async()=>{
    const next=await CustomerReview.read(context);
    if(next){setSnapshot(next);return true;}
    return false;
  };
  return snapshot ? React.createElement(Status.make,{snapshot,onCheck:check}) : React.createElement('p',{id:'original-error'},error);
}
window.customerReview=CustomerReview;
window.fixtureContext=context;
window.makeHyper=Hyper.make;
window.acceptsCustomerBindingMessage=event=>Utils.isParentMessage(location.origin,{...event,origin:location.origin});
const store=createStore();
store.set(Atoms.keys,{...CommonHooks.defaultkeys,...context,customerBackendUrl:context.backendUrl,parentURL:location.origin});
createRoot(document.getElementById('app')).render(React.createElement(Provider,{store},React.createElement(SubmitProbe),React.createElement(PaymentMountProbe),React.createElement(Fixture)));
