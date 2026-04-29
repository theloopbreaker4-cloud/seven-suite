import { Component, OnInit, signal, computed } from '@angular/core';
import { CmsApiService, CmsComment } from '../../services/cms-api.service';

type CommentFilter = 'all' | 'pending' | 'approved';

@Component({
  selector: 'app-admin-comments',
  standalone: false,
  templateUrl: './admin-comments.component.html',
})
export class AdminCommentsComponent implements OnInit {
  readonly filters: CommentFilter[] = ['all', 'pending', 'approved'];
  comments = signal<CmsComment[]>([]);
  loading  = signal(false);
  error    = signal<string | null>(null);
  filter   = signal<CommentFilter>('all');

  filtered = computed(() => {
    const f = this.filter();
    if (f === 'approved') return this.comments().filter(c => c.isApproved);
    if (f === 'pending')  return this.comments().filter(c => !c.isApproved);
    return this.comments();
  });

  constructor(private api: CmsApiService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getComments().subscribe({
      next: comments => { this.comments.set(comments); this.loading.set(false); },
      error: () => { this.error.set('Failed to load comments'); this.loading.set(false); }
    });
  }

  approve(c: CmsComment): void {
    this.api.approveComment(c._id).subscribe({
      next: () => {
        this.comments.update(list => list.map(x => x._id === c._id ? { ...x, isApproved: true } : x));
      },
      error: () => this.error.set('Failed to approve')
    });
  }

  delete(c: CmsComment): void {
    if (!confirm('Delete this comment?')) return;
    this.api.deleteComment(c._id).subscribe({
      next: () => this.comments.update(list => list.filter(x => x._id !== c._id)),
      error: () => this.error.set('Failed to delete')
    });
  }

  fmt(d: string): string { return d ? new Date(d).toLocaleDateString() : '—'; }
}
