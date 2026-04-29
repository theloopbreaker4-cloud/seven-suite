import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsCategory } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-categories',
  standalone: false,
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<CmsCategory[]>([]);
  loading    = signal(false);
  saving     = signal(false);
  error      = signal<string | null>(null);

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
      slug:        ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      type:        ['post'],
      name:        i18n(),
      description: i18n(),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: cats => { this.categories.set(cats); this.loading.set(false); },
      error: () => { this.error.set('Failed to load categories'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editId = null;
    this.form.reset({ type: 'post' });
    this.view = 'form';
  }

  openEdit(cat: CmsCategory): void {
    this.editId = cat._id;
    this.form.patchValue({ slug: cat.slug, type: cat.type, name: cat.name, description: cat.description });
    this.view = 'form';
  }

  cancel(): void { this.view = 'list'; this.editId = null; }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const call = this.editId
      ? this.api.updateCategory(this.editId, this.form.value)
      : this.api.createCategory(this.form.value);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save'); this.saving.set(false); }
    });
  }

  delete(cat: CmsCategory): void {
    if (!confirm(`Delete category "${cat.slug}"?`)) return;
    this.api.deleteCategory(cat._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete')
    });
  }

  t(field: I18nField): string {
    return field?.['en'] || Object.values(field || {})[0] || '—';
  }
}

type I18nField = Record<string, string>;
