/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-routing.module.ts
 * Description: Admin panel routing configuration with role-based access
 * Created: 2025-11-03
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminSettingsComponent } from './pages/admin-settings/admin-settings.component';
import { AdminPagesComponent }      from './pages/admin-pages/admin-pages.component';
import { AdminBlogComponent }       from './pages/admin-blog/admin-blog.component';
import { AdminCategoriesComponent } from './pages/admin-categories/admin-categories.component';
import { AdminTagsComponent }       from './pages/admin-tags/admin-tags.component';
import { AdminCommentsComponent }   from './pages/admin-comments/admin-comments.component';
import { AdminSocialComponent }     from './pages/admin-social/admin-social.component';
import { AdminSliderComponent }     from './pages/admin-slider/admin-slider.component';
import { AdminMenusComponent }      from './pages/admin-menus/admin-menus.component';
import { AdminMediaComponent }      from './pages/admin-media/admin-media.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'pages',     component: AdminPagesComponent },
      { path: 'blog',       component: AdminBlogComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'tags',       component: AdminTagsComponent },
      { path: 'comments',   component: AdminCommentsComponent },
      { path: 'social',     component: AdminSocialComponent },
      { path: 'slider',     component: AdminSliderComponent },
      { path: 'menus',      component: AdminMenusComponent },
      { path: 'media',      component: AdminMediaComponent },
      { path: 'users',      component: AdminUsersComponent },
      { path: 'settings',   component: AdminSettingsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
