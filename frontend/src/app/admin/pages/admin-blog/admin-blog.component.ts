import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsPost } from '../../services/cms-api.service';

type ViewMode = 'list' | 'form';

@Component({
  selector: 'app-admin-blog',
  standalone: false,
  templateUrl: './admin-blog.component.html',
  styleUrls: ['./admin-blog.component.less']
})
export class AdminBlogComponent implements OnInit {
  posts = signal<CmsPost[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  view: ViewMode = 'list';
  editId: string | null = null;
  form!: FormGroup;
  search = '';

  readonly langs = ['en', 'ru', 'ka', 'uk', 'az', 'hy'];
  activeLang = 'en';

  constructor(private api: CmsApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    const i18nGroup = (langs: string[]) =>
      this.fb.group(Object.fromEntries(langs.map(l => [l, ['', []]])));

    this.form = this.fb.group({
      slug:        ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      coverImage:  [''],
      isPublished: [true],
      title:       i18nGroup(this.langs),
      excerpt:     i18nGroup(this.langs),
      content:     i18nGroup(this.langs),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getPosts().subscribe({
      next: res => { this.posts.set(res.items || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load posts'); this.loading.set(false); }
    });
  }

  get filtered(): CmsPost[] {
    const q = this.search.toLowerCase();
    return q
      ? this.posts().filter(p => p.slug.includes(q) || p.title['en']?.toLowerCase().includes(q))
      : this.posts();
  }

  openCreate(): void {
    this.editId = null;
    this.form.reset({ isPublished: true });
    this.view = 'form';
  }

  openEdit(post: CmsPost): void {
    this.editId = post._id;
    this.form.patchValue({
      slug:        post.slug,
      coverImage:  post.coverImage,
      isPublished: post.isPublished,
      title:       post.title,
      excerpt:     post.excerpt,
      content:     post.content,
    });
    this.view = 'form';
  }

  cancel(): void {
    this.view = 'list';
    this.editId = null;
    this.form.reset({ isPublished: true });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const data = this.form.value;
    const call = this.editId
      ? this.api.updatePost(this.editId, data)
      : this.api.createPost(data);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save post'); this.saving.set(false); }
    });
  }

  delete(post: CmsPost): void {
    if (!confirm(`Delete post "${post.slug}"?`)) return;
    this.api.deletePost(post._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete post')
    });
  }

  t(field: Record<string, string>): string {
    return field?.['en'] || Object.values(field || {})[0] || '—';
  }
}
