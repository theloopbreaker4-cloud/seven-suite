/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { apiError } from '../core/api-error';

/**
 * Submit state for a form: busy flag, per-field errors from the API (422 `fields`) and one
 * general message. Known error codes are shown in the UI language (`errors.<code>`), others
 * fall back to the server's English text.
 */
export class FormState {
  private readonly transloco = inject(TranslocoService);
  readonly busy = signal(false);
  readonly fields = signal<Record<string, string>>({});
  readonly message = signal<string | null>(null);

  async run(action: () => Promise<unknown>): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true);
    this.fields.set({});
    this.message.set(null);
    try {
      await action();
      return true;
    } catch (e) {
      const err = apiError(e);
      if (err.fields) this.fields.set(err.fields);
      else this.message.set(this.translate(err.code, err.error));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private translate(code: string, fallback: string): string {
    const key = `errors.${code}`;
    const text = this.transloco.translate(key);
    return text && text !== key ? text : fallback;
  }
}
