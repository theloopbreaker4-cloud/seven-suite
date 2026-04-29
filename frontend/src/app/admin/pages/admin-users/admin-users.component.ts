/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-users.component.ts
 * Description: Admin users management — loads from NestJS API, supports search/edit/delete
 * Created: 2025-11-03
 */

import { AfterViewInit, Component, OnInit, ViewChild, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CmsApiService, CmsUser } from '../../services/cms-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.less']
})
export class AdminUsersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<CmsUser>([]);
  searchValue = '';

  loading = signal(false);
  error   = signal<string | null>(null);

  constructor(private api: CmsApiService) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (u, filter) => {
      const hay = `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`.toLowerCase();
      return hay.includes(filter);
    };
  }

  private load(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (res: any) => {
        const users: CmsUser[] = Array.isArray(res) ? res : (res?.items ?? res?.users ?? []);
        this.dataSource.data = users;
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load users'); this.loading.set(false); }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearSearch(): void {
    this.searchValue = '';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'active' : 'inactive';
  }

  getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      admin: '#667eea',
      user:  '#48bb78',
    };
    return colors[role] || '#a0aec0';
  }

  toggleActive(user: CmsUser): void {
    const next = !user.isActive;
    this.api.updateUser(user._id, { isActive: next }).subscribe({
      next: updated => { user.isActive = updated.isActive; },
      error: () => this.error.set('Failed to update user'),
    });
  }

  toggleRole(user: CmsUser): void {
    const role: 'user' | 'admin' = user.role === 'admin' ? 'user' : 'admin';
    this.api.updateUser(user._id, { role }).subscribe({
      next: updated => { user.role = updated.role; },
      error: () => this.error.set('Failed to update role'),
    });
  }

  deleteUser(user: CmsUser): void {
    if (!confirm(`Delete user "${user.email}"?`)) return;
    this.api.deleteUser(user._id).subscribe({
      next: () => { this.dataSource.data = this.dataSource.data.filter(u => u._id !== user._id); },
      error: () => this.error.set('Failed to delete user'),
    });
  }

  editUser(user: CmsUser): void { this.toggleRole(user); }
  viewUser(user: CmsUser): void { console.log('View user:', user); }
}
