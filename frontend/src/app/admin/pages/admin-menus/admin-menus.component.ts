/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-menus.component.ts
 * Description: Admin Menus page — CRUD for navigation menus with inline menu item editor
 * Created: 2026-04-24
 */

import { Component, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CmsApiService, CmsMenu } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-menus',
  standalone: false,
  templateUrl: './admin-menus.component.html',
})
export class AdminMenusComponent implements OnInit {
  menus   = signal<CmsMenu[]>([]);
  loading = signal(false);
  saving  = signal(false);
  error   = signal<string | null>(null);

  view: 'list' | 'form' = 'list';
  editId: string | null = null;
  form!: FormGroup;

  constructor(private api: CmsApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      handle: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      name:   ['', Validators.required],
      items:  this.fb.array([]),
    });
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  newItem(data: { label?: string; url?: string; target?: string; sortOrder?: number } = {}): FormGroup {
    return this.fb.group({
      label:     [data.label ?? '', Validators.required],
      url:       [data.url ?? '', Validators.required],
      target:    [data.target ?? '_self'],
      sortOrder: [data.sortOrder ?? 0],
    });
  }

  addItem(): void { this.items.push(this.newItem()); }
  removeItem(idx: number): void { this.items.removeAt(idx); }

  private load(): void {
    this.loading.set(true);
    this.api.getMenus().subscribe({
      next: menus => { this.menus.set(menus); this.loading.set(false); },
      error: () => { this.error.set('Failed to load menus'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editId = null;
    this.form.reset({ handle: '', name: '' });
    this.items.clear();
    this.view = 'form';
  }

  openEdit(menu: CmsMenu): void {
    this.editId = menu._id;
    this.form.patchValue({ handle: menu.handle, name: menu.name });
    this.items.clear();
    (menu.items || []).forEach(it => this.items.push(this.newItem(it)));
    this.view = 'form';
  }

  cancel(): void { this.view = 'list'; this.editId = null; }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const call = this.editId
      ? this.api.updateMenu(this.editId, this.form.value)
      : this.api.createMenu(this.form.value);

    call.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => { this.error.set('Failed to save'); this.saving.set(false); }
    });
  }

  delete(menu: CmsMenu): void {
    if (!confirm(`Delete menu "${menu.handle}"?`)) return;
    this.api.deleteMenu(menu._id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Failed to delete')
    });
  }
}
