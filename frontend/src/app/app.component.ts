/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: app.component.ts
 * Description: Root application component with loading state and meta tag configuration
 * Created: 2025-10-26
 */

import { Component, OnInit } from '@angular/core';
import { Title, Meta } from "@angular/platform-browser";
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    standalone: false
})
export class AppComponent implements OnInit {
  title: string = 'Seven App';
  loading: boolean = true;

  constructor(
    private titleService: Title,
    private Meta: Meta,
    private themeService: ThemeService,
    private i18n: I18nService
  ) {
    this.titleService.setTitle('SevenCMS');
    this.Meta.addTag({ name: 'description', content: 'SevenCMS — modern content management system' });
  }

  ngOnInit(): void {
    this.themeService.watchSystemTheme();
    this.i18n.init().finally(() => { this.loading = false; });
  }
}
