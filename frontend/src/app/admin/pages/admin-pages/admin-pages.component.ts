import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsPage } from '../../services/cms-api.service';

type ViewMode = 'list' | 'form';

@Component({
  selector: 'app-admin-pages',
  standalone: false,
  templateUrl: './admin-pages.component.html',
  styleUrls: ['./admin-pages.component.less']
})
export class AdminPagesComponent implements OnInit {
  pages = signal<CmsPage[]>([]);
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
      isPublished: [true],
      title:       i18nGroup(this.langs),
      content:     i18nGroup(this.langs),
      metaDesc:    i18nGroup(this.langs),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getPages().subscribe({
      next: res => { this.pages.set(res.items || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load pages'); this.loading.set(false); }
    });
  }

  get filtered(): CmsPage[] {
    const q = this.search.toLowerCase();
    return q
      ? this.pages().filter(p => p.slug.includes(q) || p.title['en']?.toLowerCase().includes(q))
      : this.pages();
  }

  openCreate(): void {
    this.editId = null;
    this.form.reset({ isPublished: true });
    this.view = 'form';
  }

  openEdit(page: CmsPage): void {
    this.editId = page._id;
    this.form.patchValue({
      slug:        page.slug,
      isPublished: page.isPublished,
      title:       page.title,
      content:     page.content,
      metaDesc:    page.metaDesc,
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
      ? this.api.updatePage(this.editId, data)
      : this.api.createPage(data);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save page'); this.saving.set(false); }
    });
  }

  delete(page: CmsPage): void {
    if (!confirm(`Delete page "${page.slug}"?`)) return;
    this.api.deletePage(page._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete page')
    });
  }

  t(field: Record<string, string>): string {
    return field?.['en'] || Object.values(field || {})[0] || '—';
  }
}
