/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-sidebar.component.ts
 * Description: Admin panel sidebar navigation
 * Created: 2025-11-03
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: false,
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.less']
})
export class AdminSidebarComponent implements OnInit {
  year = new Date().getFullYear();

  overviewItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',  route: '/admin/dashboard' },
  ];

  contentItems: NavItem[] = [
    { label: 'Blog',       icon: 'feed',        route: '/admin/blog' },
    { label: 'Pages',      icon: 'article',     route: '/admin/pages' },
    { label: 'Categories', icon: 'label',       route: '/admin/categories' },
    { label: 'Tags',       icon: 'tag',         route: '/admin/tags' },
    { label: 'Comments',   icon: 'comment',     route: '/admin/comments' },
    { label: 'Media',      icon: 'perm_media',  route: '/admin/media' },
    { label: 'Slider',     icon: 'view_carousel', route: '/admin/slider' },
  ];

  structureItems: NavItem[] = [
    { label: 'Menus',      icon: 'menu',        route: '/admin/menus' },
    { label: 'Social',     icon: 'share',       route: '/admin/social' },
  ];

  systemItems: NavItem[] = [
    { label: 'Users',      icon: 'people',      route: '/admin/users' },
    { label: 'Settings',   icon: 'settings',    route: '/admin/settings' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
