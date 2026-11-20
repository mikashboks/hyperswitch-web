import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider,createStore} from 'jotai';
import * as Payment from '../src/Payment.bs.js';
import * as PaymentHelpers from '../src/Utilities/PaymentHelpers.bs.js';
import * as CustomerReview from '../src/Utilities/CustomerReview.bs.js';
import * as Atoms from '../src/Utilities/JotaiAtoms.bs.js';
import * as CommonHooks from '../src/Hooks/CommonHooks.bs.js';
import * as Logger from '../src/Utilities/LoggerUtils.bs.js';
import * as ApiEndpoint from '../src/Utilities/ApiEndpoint.bs.js';
const store=createStore();
const base={hosted_api:'v2',payment_id:'aa_pay_fixture',profile_id:'pro_fixture',publishable_key:'pk_snd_fixture',client_secret:'cs_fixture',tenant_id:'public'};
let current={...base};
const authorization=ctx=>btoa(Object.entries(ctx).map(([key,value])=>`${key}=${value}`).join(','));
function initialize(overrides={}){
 current={...base,...overrides};
 store.set(Atoms.keys,{...CommonHooks.defaultkeys,clientSecret:'',sdkAuthorization:authorization(current),publishableKey:current.publishable_key,parentURL:location.origin,customerBackendUrl:location.origin,iframeId:'fixture'});
 store.set(Atoms.customerReview,{});
 store.set(Atoms.paymentMethodList,'SemiLoaded');
}
initialize();
function Probe(){
 const submit=PaymentHelpers.usePaymentIntent(undefined,'Card');
 React.useEffect(()=>{
  window.submit=()=>new Promise(resolve=>submit(false,[['payment_method','card'],['payment_method_data',{card:{card_number:'4242424242424242'}}]],{return_url:location.origin+'/return',publishableKey:current.publishable_key},undefined,false,resolve));
  window.originalSubmit=window.originalSubmit||window.submit;
  window.ready=true;
 });return null;
}
window.customerReview=CustomerReview;
window.initialize=initialize;
window.fixtureStore=store;
window.fixtureAtoms=Atoms;
window.reviewContext=()=>CustomerReview.hostedContext(location.origin,authorization(current),current.publishable_key,'');
window.setBackend=url=>{ApiEndpoint.setApiEndPoint(url);};
createRoot(document.getElementById('app')).render(React.createElement(Provider,{store},React.createElement(Probe),React.createElement(Payment.make,{paymentMode:'payment',integrateError:false,logger:Logger.defaultLoggerConfig})));
