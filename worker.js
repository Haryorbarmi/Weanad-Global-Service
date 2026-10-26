// Worker entry: routes the contact form to the Resend handler, serves the static site for everything else.
import { onRequestPost } from './functions/api/contact.js';
import { onRequestPost as onRequestPostCallback } from './functions/api/callback.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // One public address for Google: send www and the workers.dev address to the main domain.
    if ((url.hostname === 'www.weanadglobal.com' || url.hostname.endsWith('.workers.dev')) && ['GET', 'HEAD'].includes(request.method)) {
      return Response.redirect(`https://weanadglobal.com${url.pathname}${url.search}`, 301);
    }

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return onRequestPost({ request, env });
    }

    if (url.pathname === '/api/callback') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return onRequestPostCallback({ request, env });
    }

    return env.ASSETS.fetch(request);
  },
};
