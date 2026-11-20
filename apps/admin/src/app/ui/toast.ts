/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, inject, Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

/** Short-lived notifications; errors stay a little longer. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private next = 1;

  success(text: string): void {
    this.push('success', text, 3500);
  }
  error(text: string): void {
    this.push('error', text, 6000);
  }
  info(text: string): void {
    this.push('info', text, 4000);
  }
  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string, ms: number): void {
    const id = this.next++;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}

@Component({
  selector: 'sv-toast-host',
  template: `
    <div
      class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
      aria-live="polite"
    >
      @for (t of toasts.toasts(); track t.id) {
        <div
          class="sv-card pointer-events-auto flex items-start gap-3 px-4 py-3 text-sm shadow-lg"
          [class.border-danger]="t.kind === 'error'"
          [class.border-success]="t.kind === 'success'"
          role="status"
        >
          <span class="flex-1">{{ t.text }}</span>
          <button
            type="button"
            class="text-muted hover:text-text"
            (click)="toasts.dismiss(t.id)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
