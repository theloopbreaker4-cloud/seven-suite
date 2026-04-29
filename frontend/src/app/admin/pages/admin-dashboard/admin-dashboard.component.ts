/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-dashboard.component.ts
 * Description: Admin dashboard — live counters pulled from CMS API (posts, pages, users, comments)
 * Created: 2025-11-03
 */

import { Component, OnInit, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CmsApiService, CmsComment, CmsPost } from '../../services/cms-api.service';

interface StatCard {
  title: string;
  value: string | number;
  icon:  string;
  color: string;
}

interface ActivityItem {
  user:   string;
  action: string;
  time:   string;
  icon:   string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.less']
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(false);
  stats   = signal<StatCard[]>([]);
  recentActivities = signal<ActivityItem[]>([]);

  constructor(private api: CmsApiService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);

    forkJoin({
      posts:    this.api.getPosts(100, 0).pipe(catchError(() => of({ items: [] as CmsPost[], total: 0 }))),
      pages:    this.api.getPages()      .pipe(catchError(() => of({ items: [], total: 0 }))),
      users:    this.api.getUsers()      .pipe(catchError(() => of([] as any))),
      comments: this.api.getComments()   .pipe(catchError(() => of([] as CmsComment[]))),
    }).subscribe(({ posts, pages, users, comments }) => {
      const usersArr: any[] = Array.isArray(users) ? users : (users?.items ?? []);
      const pendingComments = (comments || []).filter(c => !c.isApproved).length;

      this.stats.set([
        { title: 'Posts',    value: posts.total ?? posts.items.length, icon: 'feed',    color: '#667eea' },
        { title: 'Pages',    value: pages.total ?? pages.items.length, icon: 'article', color: '#48bb78' },
        { title: 'Users',    value: usersArr.length,                   icon: 'people',  color: '#f6ad55' },
        { title: 'Comments', value: pendingComments || (comments?.length ?? 0), icon: 'comment', color: '#fc8181' },
      ]);

      const latestPosts = [...(posts.items || [])]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5);

      this.recentActivities.set(latestPosts.map(p => ({
        user:   (p as any).author || 'System',
        action: `Published "${this.pickI18n(p.title)}"`,
        time:   this.timeAgo(p.createdAt),
        icon:   'feed',
      })));

      this.loading.set(false);
    });
  }

  private pickI18n(field: any): string {
    if (!field) return '—';
    if (typeof field === 'string') return field;
    return field.en || Object.values(field)[0] || '—';
  }

  private timeAgo(iso?: string): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)    return 'just now';
    if (m < 60)   return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)   return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }
}
