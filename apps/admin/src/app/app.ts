/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService } from './core/preferences.service';
import { ToastHost } from './ui/toast';

@Component({
  selector: 'sv-root',
  imports: [RouterOutlet, ToastHost],
  template: `<router-outlet /><sv-toast-host />`,
})
export class App {
  // Instantiated here so theme and language apply before the first page renders.
  protected readonly prefs = inject(PreferencesService);
}
