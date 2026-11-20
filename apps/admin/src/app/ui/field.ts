/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, input } from '@angular/core';

/**
 * Label + control + error/hint. The control is projected:
 *   <sv-field label="Email" [error]="errors().email" for="email"><input id="email" class="sv-input" …></sv-field>
 */
@Component({
  selector: 'sv-field',
  template: `
    <div class="mb-4">
      <label class="sv-label" [attr.for]="for()">{{ label() }}</label>
      <ng-content />
      @if (error()) {
        <p class="mt-1 text-sm text-danger" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p class="mt-1 text-xs text-muted">{{ hint() }}</p>
      }
    </div>
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly for = input<string>();
  readonly error = input<string | null | undefined>();
  readonly hint = input<string>();
}
