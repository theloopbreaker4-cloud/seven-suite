/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Outgoing email. SMTP in dev (Mailpit) and production; in tests messages are only collected
 * in `sent` so tests can read the links they contain. Without SMTP_URL outside tests, mail is
 * logged (subject and recipient only) instead of sent.
 *
 * Sending is awaited but never fails the caller's request: a lost email is logged and the
 * user can ask again. (M2 moves sending onto the outbox/queue for retries.)
 */
@Injectable()
export class MailService {
  readonly sent: MailMessage[] = [];
  private readonly log = new Logger('Mail');
  private readonly transport?: Transporter;

  constructor(@Inject(ENV) private readonly env: Env) {
    if (env.NODE_ENV !== 'test' && env.SMTP_URL)
      this.transport = createTransport(env.SMTP_URL);
  }

  async send(message: MailMessage): Promise<void> {
    if (this.env.NODE_ENV === 'test') {
      this.sent.push(message);
      return;
    }
    if (isReservedRecipient(message.to)) {
      // RFC 2606/6761 names never receive mail; sending would only bounce and hurt the
      // sender reputation (smoke tests on production use such addresses).
      this.log.log(
        `Skipping "${message.subject}" to reserved address ${message.to}`,
      );
      return;
    }
    if (!this.transport) {
      this.log.warn(
        `SMTP_URL not set — not sending "${message.subject}" to ${message.to}`,
      );
      return;
    }
    try {
      await this.transport.sendMail({ from: this.env.MAIL_FROM, ...message });
    } catch (e) {
      this.log.error(
        `Failed to send "${message.subject}" to ${message.to}: ${(e as Error).message}`,
      );
    }
  }
}

/** example.com/.net/.org and the .test/.example/.invalid/.localhost TLDs (RFC 2606, RFC 6761). */
export function isReservedRecipient(address: string): boolean {
  const domain = address.split('@').pop()?.toLowerCase() ?? '';
  return (
    /^(.+\.)?example\.(com|net|org)$/.test(domain) ||
    /\.(test|example|invalid|localhost)$/.test(domain)
  );
}
