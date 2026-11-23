// Explicit opt-in adapter for hosted links served by the v2-only router.
// The upstream SDK's build:v2 label does not change its legacy checkout API.
export function contextFromHeaders(headers) {
  let fields, parts;
  try { parts = atob(headers.get('Authorization') || '').split(',').map(s => s.split('=')); } catch { return null; }
  try {
    if (!parts.some(([k,v]) => k === 'hosted_api' && v === 'v2')) return null;
    if (parts.some(p => p.length !== 2) || new Set(parts.map(p => p[0])).size !== parts.length) throw Error();
    fields = Object.fromEntries(parts);
    for (const key of ['payment_id','profile_id','publishable_key','client_secret','tenant_id']) {
      if (!/^[A-Za-z0-9_-]+$/.test(fields[key] || '')) throw Error();
    }
    if (!/^[A-Za-z0-9]{2}(?:[A-Za-z0-9]{3})?_pay_[A-Za-z0-9]+$/.test(fields.payment_id)) throw Error();
    if (headers.get('x-tenant-id') !== fields.tenant_id) throw Error();
  } catch {
    throw new Error('Invalid hosted checkout context');
  }
  return fields;
}

export function confirmBody(input) {
  if (!input.payment_method || !input.payment_method_data) throw new Error('Payment details are required');
  const data = {...input.payment_method_data};
  if (input.billing) data.billing = input.billing;
  const body = {
    payment_method_type: input.payment_method,
    payment_method_subtype: input.payment_method_type,
    payment_method_data: data,
  };
  for (const key of ['return_url','shipping','customer_acceptance','browser_info','payment_method_id','payment_token']) {
    if (input[key] !== undefined) body[key] = input[key];
  }
  return body;
}

export function paymentResponse(data) {
  const amount = data.amount_details || (typeof data.amount === 'object' ? data.amount : null);
  if (!amount) return data;
  const total = ['order_amount','shipping_cost','order_tax_amount','surcharge_amount','tax_on_surcharge'].reduce((n,k) => n + (amount[k] || 0), 0);
  if (!Number.isSafeInteger(total)) throw new Error('Invalid payment amount');
  return {...data, payment_id:data.id, amount:total, currency:amount.currency};
}

export function methodListResponse(data, intent) {
  if (!Array.isArray(data.payment_methods_enabled)) throw new Error('Invalid enabled payment methods');
  const normalized=paymentResponse(intent);
  return {
    payment_methods_enabled:data.payment_methods_enabled.map(method=>({
      ...method, payment_method:method.payment_method_type,
      payment_method_type:method.payment_method_subtype,
    })),
    customer_payment_methods:data.customer_payment_methods || [],
    intent_data:normalized,
  };
}

// Present the router's required-field union using the SDK's current configuration
// format. This UI-only context identifier never selects a payment connector.
export function configResponse(data, context) {
  if (!Array.isArray(data.payment_methods_enabled)) throw new Error('Invalid enabled payment methods');
  const contexts=[],overrides={},methods=[];
  const pascal=s=>s.split('_').map(p=>p[0].toUpperCase()+p.slice(1)).join('');
  for (const [index,method] of data.payment_methods_enabled.entries()) {
    const key='required_'+index, fields={};
    for (const [order,field] of (method.required_fields || []).entries()) {
      const write=field.required_field;
      if (!/^[a-z0-9_.]+$/.test(write)) throw new Error('Invalid required field path');
      const phone=field.field_type==='user_phone_number';
      const code=field.field_type==='user_phone_number_country_code';
      const prefix='dynamic_fields.'+write;
      const props={is_required:true,confirm_request_write_path:write,
        intent_data_read_path:write.replace(/^payment_method_data\./,''),
        default_label_text:code?'Country calling code':phone?'Mobile-money number':field.display_name,
        default_placeholder_text:code?'232':phone?'76123456':field.display_name,
        field_render_type:phone?'Phone':field.field_type==='user_email_address'?'Email':'Generic',
        field_display_order:order,render_when_prefilled:true,keyboard_type:phone||code?'tel':'text'};
      for(const [name,value] of Object.entries(props))fields[prefix+'._'+name]=value;
    }
    overrides[key]=fields;
    contexts.push({condition:{payment_method:pascal(method.payment_method_type),payment_method_type:pascal(method.payment_method_subtype)},override_with_keys:[key]});
    methods.push({payment_method:method.payment_method_type,payment_method_types:[{payment_method_type:method.payment_method_subtype,payment_method_criteria:'payment_experience',criteria_rules:(method.payment_experience || []).map(experience=>({criteria_value:experience,eligible_connectors:['hosted_v2_required_fields']}))}]});
  }
  return {raw_configs:{contexts,overrides,default_configs:{}},payment_methods:methods,context_used:{profile_id:context.profile_id}};
}

function jsonResponse(data, response) {
  const headers = new Headers(response.headers);
  headers.set('content-type','application/json');headers.delete('content-length');headers.delete('content-encoding');
  return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers});
}

export async function fetchHosted(uri, init) {
  const headers = new Headers(init.headers);
  const context = contextFromHeaders(headers);
  if (!context) {
    const response = await fetch(uri, init);
    if (response.ok && (init.method || 'GET') === 'POST' && /\/v2\/payments\/[^/]+\/confirm-intent$/.test(new URL(uri).pathname)) {
      return jsonResponse(paymentResponse(await response.json()), response);
    }
    return response;
  }
  const url = new URL(uri);
  const match = url.pathname.match(/^(.*)\/payments\/([^/]+)(?:\/(.*))?$/);
  const configMatch=url.pathname.match(/^(.*)\/v1\/sdk\/configs\/web\/sdk_config\.json$/);
  if (!match && !configMatch) throw new Error('Unsupported hosted checkout operation');
  const [,prefix,id,suffix=''] = match || [null,configMatch[1],context.payment_id,'config'];
  const method = init.method || 'GET';
  const isSessions = id === 'session_tokens' && method === 'POST';
  if (!isSessions && id !== context.payment_id) throw new Error('Hosted payment identity mismatch');
  headers.set('Authorization',`publishable-key=${context.publishable_key},client-secret=${context.client_secret}`);
  headers.set('x-profile-id',context.profile_id);
  const base = `${url.origin}${prefix}/v2/payments/${context.payment_id}`;
  const options = {...init,headers};
  let endpoint;
  if (isSessions) { endpoint=base+'/create-external-sdk-tokens';options.body='{}'; }
  else if ((suffix === 'client' || suffix === 'config') && method === 'GET') endpoint=base+'/payment-methods';
  else if (suffix === 'confirm' && method === 'POST') { endpoint=base+'/confirm-intent';options.body=JSON.stringify(confirmBody(JSON.parse(init.body))); }
  else if (suffix === '' && method === 'GET') endpoint=base+url.search;
  else throw new Error('Unsupported hosted checkout operation');
  const response = await fetch(endpoint,options);
  if (!response.ok) return response;
  if (isSessions) return response;
  const data = await response.json();
  if (suffix === 'config') return jsonResponse(configResponse(data,context),response);
  if (suffix === 'client') {
    const intentResponse=await fetch(base+'/get-intent',{method:'GET',headers,signal:init.signal});
    if (!intentResponse.ok) return intentResponse;
    return jsonResponse(methodListResponse(data,await intentResponse.json()),response);
  }
  return jsonResponse(paymentResponse(data),response);
}
