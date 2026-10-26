// POST /api/callback: quick "contact me" email box (footer and home page call-to-action)
import { esc, json, sendEmail, SITE, GREEN, GOLD } from './contact.js';

function thanksHtml() {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F7F5;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td align="center" style="background:${GREEN};padding:28px 24px;">
      <img src="${SITE}/assets/img/weanad-icon-white.png" alt="Weanad Global" width="72" style="display:block;border:0;margin:0 auto 10px;">
      <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">WEANAD GLOBAL</div>
      <div style="color:${GOLD};font-size:11px;letter-spacing:2px;margin-top:4px;">SERVICES LTD</div>
    </td></tr>
    <tr><td style="padding:32px;font-size:16px;line-height:1.6;">
      <h1 style="margin:0 0 16px;font-size:24px;color:${GREEN};">Thanks for getting in touch!</h1>
      <p style="margin:0 0 14px;">We have your email address, and a member of our team will contact you as soon as we can.</p>
      <p style="margin:0;">If you would like to tell us more about what you need, you can reply to this email or call us on <a href="tel:+2348148941256" style="color:${GREEN};">+234 814 894 1256</a>.</p>
    </td></tr>
    <tr><td align="center" style="padding:0 32px 32px;">
      <a href="${SITE}" style="display:inline-block;background:${GOLD};color:${GREEN};text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:6px;">Visit our website</a>
    </td></tr>
    <tr><td style="background:${GREEN};padding:22px 32px;font-size:13px;line-height:1.7;color:#ffffff;text-align:center;">
      <strong>Weanad Global Services Ltd</strong> &middot; RC 8179335<br>
      31, Mall B, Omida Shopping Mall, Omida, Abeokuta, Nigeria<br>
      <a href="tel:+2348148941256" style="color:${GOLD};text-decoration:none;">+234 814 894 1256</a> &nbsp;|&nbsp;
      <a href="tel:+2347032763035" style="color:${GOLD};text-decoration:none;">+234 703 276 3035</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'Invalid submission.' }, 400);
  }

  if (data._honey) return json({ ok: true });

  const email = (data.email || '').trim().slice(0, 150);
  const page = (data.page || '').trim().slice(0, 100);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Mail service is not configured.', code: 'no_key' }, 500);

  const from = env.FROM_EMAIL || 'Weanad Global <info@weanadglobal.com>';
  const to = env.TO_EMAIL || 'weanadgltd@hotmail.com';

  try {
    await sendEmail(env, {
      from,
      to: [to],
      reply_to: email,
      subject: `Callback request from ${email}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#2b2b2b;">
        <h2 style="margin:0 0 14px;color:${GREEN};">Someone wants to be contacted</h2>
        <p style="font-size:15px;">Email: <a href="mailto:${esc(email)}">${esc(email)}</a></p>
        ${page ? `<p style="font-size:13px;color:#888;">Sent from: ${esc(page)}</p>` : ''}
        <p style="font-size:13px;color:#888;">Press Reply to write to them directly.</p>
      </div>`,
    });

    await sendEmail(env, {
      from,
      to: [email],
      reply_to: to,
      subject: 'Thanks for getting in touch - Weanad Global',
      html: thanksHtml(),
    }).catch(() => {});

    return json({ ok: true });
  } catch (err) {
    console.error(err.message);
    return json({ ok: false, error: 'Could not send.' }, 500);
  }
}
