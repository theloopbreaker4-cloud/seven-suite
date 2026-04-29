/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: blog-page.component.ts
 * Description: Public blog list — pulls posts from /api/v1/posts and renders cards
 * Created: 2026-04-24
 */

import { Component, OnInit, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../services/i18n.service';

interface Post {
  _id: string;
  slug: string;
  title: Record<string, string>;
  excerpt?: Record<string, string>;
  content?: Record<string, string>;
  coverImage?: string;
  isPublished?: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-blog-page',
  standalone: false,
  templateUrl: './blog-page.component.html',
})
export class BlogPageComponent implements OnInit {
  posts   = signal<Post[]>([]);
  loading = signal(false);

  constructor(private http: HttpClient, private i18n: I18nService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.http.get<{ items: Post[]; total: number }>(`${environment.apiUrl}/v1/posts?limit=50`).subscribe({
      next: res => {
        this.posts.set((res?.items || []).filter(p => p.isPublished !== false));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  t(k: string): string { return this.i18n.t(k); }
  tr(k: string, fallback: string): string { return this.i18n.tOr(k, fallback); }

  pick(field?: Record<string, string>): string {
    if (!field) return '';
    return field[this.i18n.lang()] || field['en'] || Object.values(field).find(v => v) || '';
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(this.i18n.lang(), { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
