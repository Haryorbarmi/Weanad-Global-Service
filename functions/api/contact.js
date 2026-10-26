// Cloudflare Pages Function: POST /api/contact (sends enquiries via Resend)
// Env vars: RESEND_API_KEY (secret), FROM_EMAIL, TO_EMAIL

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sendEmail(env, payload) {
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
      html: `<h2>New enquiry from the Weanad website</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Service:</strong> ${esc(subject) || '-'}</p>
        <p><strong>Message:</strong><br>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });

    // Auto-reply to the visitor. A failure here should not fail the enquiry.
    await sendEmail(env, {
      from,
      to: [email],
      reply_to: to,
      subject: 'We received your enquiry - Weanad Global',
      html: `<p>Hello ${esc(name)},</p>
        <p>Thank you for contacting Weanad Global Services Ltd. We have received your message and will get back to you shortly.</p>
        <p>Kind regards,<br>Weanad Global Services Ltd<br>31, Mall B, Omida Shopping Mall, Omida, Abeokuta, Nigeria<br>+234 814 894 1256 / +234 703 276 3035</p>`,
    }).catch(() => {});

    return json({ ok: true });
  } catch (err) {
    console.error(err.message);
    return json({ ok: false, error: 'Message could not be sent.' }, 500);
  }
}
