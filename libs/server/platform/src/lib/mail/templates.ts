/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import type { MailMessage } from './mail.service';

// English only for now; per-language templates come with the i18n work in M2.

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] ?? c,
  );

function layout(
  to: string,
  subject: string,
  lines: string[],
  link: { url: string; label: string },
): MailMessage {
  const text = `${lines.join('\n\n')}\n\n${link.label}: ${link.url}\n`;
  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:520px">` +
    lines.map((l) => `<p>${escape(l)}</p>`).join('') +
    `<p><a href="${escape(link.url)}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none">${escape(link.label)}</a></p>` +
    `<p style="color:#666;font-size:12px">If the button doesn't work, open this link: ${escape(link.url)}</p></div>`;
  return { to, subject, text, html };
}

export const verifyEmailMail = (to: string, name: string, url: string) =>
  layout(
    to,
    'Confirm your email — Seven Suite',
    [
      `Hi ${name},`,
      'Please confirm your email address. The link is valid for 48 hours.',
    ],
    { url, label: 'Confirm email' },
  );

export const resetPasswordMail = (to: string, name: string, url: string) =>
  layout(
    to,
    'Reset your password — Seven Suite',
    [
      `Hi ${name},`,
      'Someone asked to reset the password for this account. The link is valid for 1 hour.',
      "If it wasn't you, ignore this email — your password stays the same.",
    ],
    { url, label: 'Choose a new password' },
  );

export const invitationMail = (
  to: string,
  inviter: string,
  organization: string,
  url: string,
) =>
  layout(
    to,
    `${inviter} invited you to ${organization} — Seven Suite`,
    [
      `${inviter} invited you to join ${organization} on Seven Suite.`,
      'The invitation is valid for 7 days.',
    ],
    { url, label: 'Accept invitation' },
  );
