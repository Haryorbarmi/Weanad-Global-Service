// Cloudflare Pages Function: POST /api/contact (sends enquiries via Resend)
// Env vars: RESEND_API_KEY (secret), FROM_EMAIL, TO_EMAIL

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Brand colours and image host for emails. Images must be absolute URLs.
export const SITE = 'https://weanadglobal.com';
export const GREEN = '#1C4A3E';
export const GOLD = '#F5B800';

function autoReplyHtml(name, service, message) {
  const first = esc(name.split(/\s+/)[0]);
  const recap = `${service ? `<strong>Service:</strong> ${esc(service)}<br>` : ''}<strong>Your message:</strong><br>${esc(message).replace(/\n/g, '<br>')}`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F7F5;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
<div style="display:none;max-height:0;overflow:hidden;">Thanks for reaching out to Weanad Global. We have your message.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td align="center" style="background:${GREEN};padding:28px 24px;">
      <img src="${SITE}/assets/img/weanad-icon-white.png" alt="Weanad Global" width="72" style="display:block;border:0;margin:0 auto 10px;">
      <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">WEANAD GLOBAL</div>
      <div style="color:${GOLD};font-size:11px;letter-spacing:2px;margin-top:4px;">SERVICES LTD</div>
    </td></tr>
    <tr><td style="padding:32px 32px 8px;font-size:16px;line-height:1.6;">
      <h1 style="margin:0 0 16px;font-size:24px;color:${GREEN};">Hi ${first}, thanks for reaching out!</h1>
      <p style="margin:0 0 14px;">We have received your message, and it is on its way to our team. Someone will get back to you as soon as we can.</p>
      <p style="margin:0 0 20px;">In the meantime, here is a copy of what you sent us:</p>
      <div style="background:#F4F7F5;border-left:4px solid ${GOLD};padding:14px 16px;font-size:14px;line-height:1.6;">${recap}</div>
    </td></tr>
    <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 10px;"><strong style="color:${GREEN};">How we can help</strong></p>
      <p style="margin:0;">Microloans &middot; Savings &middot; Investments &middot; Financial Advisory</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 32px 32px;">
      <a href="${SITE}" style="display:inline-block;background:${GOLD};color:${GREEN};text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:6px;">Visit our website</a>
    </td></tr>
    <tr><td style="background:${GREEN};padding:22px 32px;font-size:13px;line-height:1.7;color:#ffffff;text-align:center;">
      <strong>Weanad Global Services Ltd</strong> &middot; RC 8179335<br>
      31, Mall B, Omida Shopping Mall, Omida, Abeokuta, Nigeria<br>
      <a href="tel:+2348148941256" style="color:${GOLD};text-decoration:none;">+234 814 894 1256</a> &nbsp;|&nbsp;
      <a href="tel:+2347032763035" style="color:${GOLD};text-decoration:none;">+234 703 276 3035</a><br>
      <a href="mailto:weanadgltd@hotmail.com" style="color:${GOLD};text-decoration:none;">weanadgltd@hotmail.com</a>
    </td></tr>
  </table>
  <p style="font-size:12px;color:#888;margin:14px 0 0;">You are receiving this because you sent an enquiry through weanadglobal.com.</p>
</td></tr>
</table>
</body></html>`;
}

export async function sendEmail(env, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Invalid submission.' }, 400);
  }

  // Honeypot: bots fill this hidden field, people don't.
  if (data._honey) return json({ ok: true });

  const name = (data.name || '').trim().slice(0, 100);
  const email = (data.email || '').trim().slice(0, 150);
  const subject = (data.subject || '').trim().slice(0, 150);
  const message = (data.message || '').trim().slice(0, 4000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please complete the form and try again.' }, 400);
  }

  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Mail service is not configured.', code: 'no_key' }, 500);

  const from = env.FROM_EMAIL || 'Weanad Global <info@weanadglobal.com>';
  const to = env.TO_EMAIL || 'weanadgltd@hotmail.com';

  try {
    // Notification to the Weanad inbox. Reply goes straight to the visitor.
    await sendEmail(env, {
      from,
      to: [to],
      reply_to: email,
      subject: `New enquiry from ${name}${subject ? ' - ' + subject : ''}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#2b2b2b;">
        <h2 style="margin:0 0 14px;color:${GREEN};">New enquiry from the website</h2>
        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:15px;">
          <tr><td style="background:#F4F7F5;width:90px;"><strong>Name</strong></td><td>${esc(name)}</td></tr>
          <tr><td style="background:#F4F7F5;"><strong>Email</strong></td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
          <tr><td style="background:#F4F7F5;"><strong>Service</strong></td><td>${esc(subject) || '-'}</td></tr>
          <tr><td style="background:#F4F7F5;vertical-align:top;"><strong>Message</strong></td><td>${esc(message).replace(/\n/g, '<br>')}</td></tr>
        </table>
        <p style="font-size:13px;color:#888;">Press Reply to answer ${esc(name)} directly.</p>
      </div>`,
    });

    // Auto-reply to the visitor. A failure here should not fail the enquiry.
    await sendEmail(env, {
      from,
      to: [email],
      reply_to: to,
      subject: 'We received your enquiry - Weanad Global',
      html: autoReplyHtml(name, subject, message),
    }).catch(() => {});

    return json({ ok: true });
  } catch (err) {
    console.error(err.message);
    return json({ ok: false, error: 'Message could not be sent.' }, 500);
  }
}
