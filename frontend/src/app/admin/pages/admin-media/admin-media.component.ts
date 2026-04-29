/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-media.component.ts
 * Description: Admin Media page — grid view of uploaded assets with upload + delete
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { CmsApiService, CmsMedia } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-media',
  standalone: false,
  templateUrl: './admin-media.component.html',
})
export class AdminMediaComponent implements OnInit {
  items    = signal<CmsMedia[]>([]);
  loading  = signal(false);
  uploading = signal(false);
  error    = signal<string | null>(null);

  constructor(private api: CmsApiService) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getMedia().subscribe({
      next: list => { this.items.set(list || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load media'); this.loading.set(false); },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.api.uploadMedia(file).subscribe({
      next: created => {
        this.items.set([created, ...this.items()]);
        this.uploading.set(false);
        input.value = '';
      },
      error: () => { this.error.set('Upload failed'); this.uploading.set(false); },
    });
  }

  delete(m: CmsMedia): void {
    if (!confirm(`Delete "${m.originalName}"?`)) return;
    this.api.deleteMedia(m._id).subscribe({
      next: () => this.items.set(this.items().filter(x => x._id !== m._id)),
      error: () => this.error.set('Failed to delete'),
    });
  }

  isImage(m: CmsMedia): boolean {
    return (m.mimeType || '').startsWith('image/');
  }

  humanSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }
}
