import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsSocialLink } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-social',
  standalone: false,
  templateUrl: './admin-social.component.html',
})
export class AdminSocialComponent implements OnInit {
  links   = signal<CmsSocialLink[]>([]);
  loading = signal(false);
  saving  = signal(false);
  error   = signal<string | null>(null);

  view: 'list' | 'form' = 'list';
  editId: string | null = null;
  form!: FormGroup;

  readonly platforms = ['facebook','twitter','instagram','youtube','linkedin','telegram','tiktok','github','discord','other'];

  constructor(private api: CmsApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      platform:  ['facebook', Validators.required],
      url:       ['', [Validators.required]],
      label:     [''],
      sortOrder: [0],
      isActive:  [true],
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.getSocialLinks().subscribe({
      next: links => { this.links.set(links); this.loading.set(false); },
      error: () => { this.error.set('Failed to load'); this.loading.set(false); }
    });
  }

  openCreate(): void { this.editId = null; this.form.reset({ platform: 'facebook', sortOrder: 0, isActive: true }); this.view = 'form'; }

  openEdit(link: CmsSocialLink): void {
    this.editId = link._id;
    this.form.patchValue(link);
    this.view = 'form';
  }

  cancel(): void { this.view = 'list'; this.editId = null; }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const call = this.editId
      ? this.api.updateSocialLink(this.editId, this.form.value)
      : this.api.createSocialLink(this.form.value);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save'); this.saving.set(false); }
    });
  }

  delete(link: CmsSocialLink): void {
    if (!confirm('Delete this social link?')) return;
    this.api.deleteSocialLink(link._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete')
    });
  }
}
