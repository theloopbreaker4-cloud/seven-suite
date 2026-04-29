import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsTag } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-tags',
  standalone: false,
  templateUrl: './admin-tags.component.html',
})
export class AdminTagsComponent implements OnInit {
  tags    = signal<CmsTag[]>([]);
  loading = signal(false);
  saving  = signal(false);
  error   = signal<string | null>(null);

  view: 'list' | 'form' = 'list';
  editId: string | null = null;
  form!: FormGroup;

  readonly langs = ['en', 'ru', 'ka', 'uk', 'az', 'hy'];
  activeLang = 'en';

  constructor(private api: CmsApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    const i18n = () => this.fb.group(Object.fromEntries(this.langs.map(l => [l, ''])));
    this.form = this.fb.group({
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      name: i18n(),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getTags().subscribe({
      next: tags => { this.tags.set(tags); this.loading.set(false); },
      error: () => { this.error.set('Failed to load tags'); this.loading.set(false); }
    });
  }

  openCreate(): void { this.editId = null; this.form.reset(); this.view = 'form'; }

  openEdit(tag: CmsTag): void {
    this.editId = tag._id;
    this.form.patchValue({ slug: tag.slug, name: tag.name });
    this.view = 'form';
  }

  cancel(): void { this.view = 'list'; this.editId = null; }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const call = this.editId
      ? this.api.updateTag(this.editId, this.form.value)
      : this.api.createTag(this.form.value);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save'); this.saving.set(false); }
    });
  }

  delete(tag: CmsTag): void {
    if (!confirm(`Delete tag "${tag.slug}"?`)) return;
    this.api.deleteTag(tag._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete')
    });
  }

  t(field: Record<string, string>): string {
    return field?.['en'] || Object.values(field || {})[0] || '—';
  }
}
