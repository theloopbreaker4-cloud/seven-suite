/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin.module.ts
 * Description: Admin panel module with lazy loading
 * Created: 2025-11-03
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Components
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';

// Pages
import { AdminDashboardComponent }  from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent }      from './pages/admin-users/admin-users.component';
import { AdminSettingsComponent }   from './pages/admin-settings/admin-settings.component';
import { AdminPagesComponent }      from './pages/admin-pages/admin-pages.component';
import { AdminBlogComponent }       from './pages/admin-blog/admin-blog.component';
import { AdminCategoriesComponent } from './pages/admin-categories/admin-categories.component';
import { AdminTagsComponent }       from './pages/admin-tags/admin-tags.component';
import { AdminCommentsComponent }   from './pages/admin-comments/admin-comments.component';
import { AdminSocialComponent }     from './pages/admin-social/admin-social.component';
import { AdminSliderComponent }     from './pages/admin-slider/admin-slider.component';
import { AdminMenusComponent }      from './pages/admin-menus/admin-menus.component';
import { AdminMediaComponent }      from './pages/admin-media/admin-media.component';

// Guards
import { AdminGuard } from './guards/admin.guard';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminSettingsComponent,
    AdminPagesComponent,
    AdminBlogComponent,
    AdminCategoriesComponent,
    AdminTagsComponent,
    AdminCommentsComponent,
    AdminSocialComponent,
    AdminSliderComponent,
    AdminMenusComponent,
    AdminMediaComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AdminRoutingModule,
    // Material
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  providers: [
    AdminGuard
  ]
})
export class AdminModule { }
