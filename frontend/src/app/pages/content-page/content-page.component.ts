/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: content-page.component.ts
 * Description: Dynamic CMS page — renders content by slug from /api/v1/pages/:slug
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-content-page',
  standalone: false,
  templateUrl: './content-page.component.html',
})
export class ContentPageComponent implements OnInit {
  page    = signal<any | null>(null);
  loading = signal(false);

  constructor(private route: ActivatedRoute, private http: HttpClient, private i18n: I18nService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => this.load(p.get('slug') || ''));
  }

  private load(slug: string): void {
    if (!slug) return;
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/v1/pages/${encodeURIComponent(slug)}`).subscribe({
      next: p => { this.page.set(p); this.loading.set(false); },
      error: () => { this.page.set(null); this.loading.set(false); },
    });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  pick(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[this.i18n.lang()] || field['en'] || Object.values(field).find(v => v as any) as string || '';
  }
}
