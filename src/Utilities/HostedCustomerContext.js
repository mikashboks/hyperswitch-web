import {contextFromHeaders} from './HostedV2Transport.js';

// Context is the backend captured from the direct parent's normal mount message,
// plus the same explicit hosted credentials used by the confirm transport.
export function hostedContext(backendUrl, authorization, publishableKey, customPodUri) {
  try {
    if (!authorization || !backendUrl) return undefined;
    const url = new URL(backendUrl);
    if (url.username || url.password || url.search || url.hash ||
        !['https:', 'http:'].includes(url.protocol)) return undefined;
    const parts = atob(authorization).split(',').map(value => value.split('='));
    const tenant = parts.find(([key]) => key === 'tenant_id')?.[1];
    const fields = contextFromHeaders(new Headers({Authorization: authorization, 'x-tenant-id': tenant || ''}));
    if (!fields || fields.publishable_key !== publishableKey || !publishableKey.startsWith('pk_')) return undefined;
    return {backendUrl, publishableKey, profileId:fields.profile_id, tenantId:fields.tenant_id,
      paymentId:fields.payment_id, clientSecret:fields.client_secret, customPodUri};
  } catch { return undefined; }
}
