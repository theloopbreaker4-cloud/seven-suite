/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AuthStore } from './auth.store';

/**
 * Render only when the current user has the permission. Cosmetic — the API enforces it.
 *   <button *svCan="'platform:member:invite'">Invite</button>
 */
@Directive({ selector: '[svCan]' })
export class CanDirective {
  readonly svCan = input.required<string>();
  private readonly store = inject(AuthStore);
  private readonly tpl = inject(TemplateRef);
  private readonly vcr = inject(ViewContainerRef);
  private shown = false;

  constructor() {
    effect(() => {
      const allowed = this.store.can(this.svCan());
      if (allowed && !this.shown) this.vcr.createEmbeddedView(this.tpl);
      if (!allowed && this.shown) this.vcr.clear();
      this.shown = allowed;
    });
  }
}
