import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CmsApiService, CmsSlide } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-slider',
  standalone: false,
  templateUrl: './admin-slider.component.html',
})
export class AdminSliderComponent implements OnInit {
  slides  = signal<CmsSlide[]>([]);
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
      title:      i18n(),
      subtitle:   i18n(),
      buttonText: i18n(),
      buttonUrl:  [''],
      image:      [''],
      overlay:    ['none'],
      sortOrder:  [0],
      isActive:   [true],
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getSlides().subscribe({
      next: slides => {
        this.slides.set([...slides].sort((a, b) => a.sortOrder - b.sortOrder));
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load slides'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editId = null;
    this.form.reset({ overlay: 'none', sortOrder: this.slides().length, isActive: true });
    this.view = 'form';
  }

  openEdit(slide: CmsSlide): void {
    this.editId = slide._id;
    this.form.patchValue(slide);
    this.view = 'form';
  }

  cancel(): void { this.view = 'list'; this.editId = null; }

  save(): void {
    this.saving.set(true);
    const call = this.editId
      ? this.api.updateSlide(this.editId, this.form.value)
      : this.api.createSlide(this.form.value);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save'); this.saving.set(false); }
    });
  }

  moveUp(slide: CmsSlide): void {
    const list = this.slides();
    const idx = list.findIndex(s => s._id === slide._id);
    if (idx <= 0) return;
    const prev = list[idx - 1];
    this.api.reorderSlides([
      { id: slide._id, sortOrder: prev.sortOrder },
      { id: prev._id, sortOrder: slide.sortOrder },
    ]).subscribe({ next: () => this.load() });
  }

  moveDown(slide: CmsSlide): void {
    const list = this.slides();
    const idx = list.findIndex(s => s._id === slide._id);
    if (idx >= list.length - 1) return;
    const next = list[idx + 1];
    this.api.reorderSlides([
      { id: slide._id, sortOrder: next.sortOrder },
      { id: next._id, sortOrder: slide.sortOrder },
    ]).subscribe({ next: () => this.load() });
  }

  delete(slide: CmsSlide): void {
    if (!confirm('Delete this slide?')) return;
    this.api.deleteSlide(slide._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete')
    });
  }

  t(field: Record<string, string>): string {
    return field?.['en'] || Object.values(field || {})[0] || '—';
  }
}
